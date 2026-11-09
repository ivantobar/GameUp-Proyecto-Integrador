import { Logger } from '@nestjs/common';
import { ServicioExternoNoDisponibleError } from '../../../common/errors/dominio.errors.js';
import type {
  ConsentimientoVigente,
  ConsultaConsentimiento,
  IdsEstudianteConsentimiento,
} from '../domain/consulta-consentimiento.js';

/**
 * Lee el consentimiento informado de ASISCO UP (Método Consuelo) por el
 * `id_usuario` de la API central, como pidió la profe:
 *   GET <base>/api/estudiantes/por-usuario/{idUsuarioAuth}/consentimiento
 *   (Authorization: Bearer <JWT de la API central de quien consulta>)
 *
 * Respuesta real (probada el 2026-11-09 con las cuentas de prueba):
 *   { idEstudiante: 23, id_usuario: 47, idUsuarioAuth: "47",
 *     versionVigente: { idVersionTerminos, codigoVersion, textoLegal },
 *     tieneConsentimientoVigente, autorizaGrabacionVoz,
 *     requiereAceptarTerminos, consentimientos[] }
 *   404 { error } si no hay estudiante con ese id_usuario.
 *
 * Ids: se pide por `idUsuarioAuth` (id_usuario central) y la respuesta
 * debe traer ESE id_usuario y el `idEstudiante` que GameUP tiene guardado
 * (`id_estudiante_externo`). Si algo no cuadra, no se usa: podría ser el
 * permiso de otro niño (→ NO_VERIFICABLE, no se guarda audio).
 *
 * Regla para grabar la voz (todas a la vez): tieneConsentimientoVigente,
 * autorizaGrabacionVoz === true y requiereAceptarTerminos !== true. Si el
 * acudiente aceptó los datos pero no la voz, el niño usa GameUP normalmente
 * y solo no se guarda audio. Si falta autorizaGrabacionVoz, se toma como
 * "no autoriza".
 *
 * Nunca registra datos del estudiante ni el textoLegal: solo el código de estado.
 */
export class ConsultaConsentimientoAsiscoUpHttp implements ConsultaConsentimiento {
  private readonly logger = new Logger(ConsultaConsentimientoAsiscoUpHttp.name);
  private readonly baseUrl: string;

  constructor(
    baseUrl: string,
    private readonly timeoutMs: number,
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async vigente(
    ids: IdsEstudianteConsentimiento,
    token?: string | null,
  ): Promise<ConsentimientoVigente | null> {
    const url = `${this.baseUrl}/api/estudiantes/por-usuario/${ids.idUsuarioAuth.toString()}/consentimiento`;

    let respuesta: Response;
    try {
      // ASISCO UP exige Bearer en /consentimiento (401 sin él).
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      respuesta = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      this.logger.warn('ASISCO UP no respondió a /consentimiento');
      throw new ServicioExternoNoDisponibleError(
        'No se puede consultar el consentimiento: ASISCO UP no responde.',
      );
    }

    // Sin estudiante con ese id_usuario en ASISCO UP: no hay consentimiento.
    if (respuesta.status === 404) return null;
    if (!respuesta.ok) {
      this.logger.warn(
        `ASISCO UP respondió ${respuesta.status} a /consentimiento`,
      );
      throw new ServicioExternoNoDisponibleError(
        'No se puede consultar el consentimiento en ASISCO UP.',
      );
    }

    let cuerpo: unknown;
    try {
      cuerpo = await respuesta.json();
    } catch {
      cuerpo = null;
    }
    return interpretarRespuesta(cuerpo, ids, this.logger);
  }
}

function interpretarRespuesta(
  cuerpo: unknown,
  ids: IdsEstudianteConsentimiento,
  logger: Logger,
): ConsentimientoVigente | null {
  if (typeof cuerpo !== 'object' || cuerpo === null) {
    return formatoInesperado(logger);
  }
  const c = cuerpo as {
    idEstudiante?: unknown;
    id_usuario?: unknown;
    idUsuarioAuth?: unknown;
    tieneConsentimientoVigente?: unknown;
    autorizaGrabacionVoz?: unknown;
    requiereAceptarTerminos?: unknown;
    versionVigente?: { codigoVersion?: unknown } | null;
  };
  if (typeof c.tieneConsentimientoVigente !== 'boolean') {
    return formatoInesperado(logger);
  }
  if (
    !mismoUsuario(c, ids.idUsuarioAuth) ||
    !mismoId(c.idEstudiante, ids.idEstudianteExterno)
  ) {
    logger.warn('ASISCO UP respondió el consentimiento de otro estudiante');
    throw new ServicioExternoNoDisponibleError(
      'ASISCO UP respondió el consentimiento de otro estudiante.',
    );
  }
  const codigo = c.versionVigente?.codigoVersion;
  if (!c.tieneConsentimientoVigente) {
    return typeof codigo === 'string'
      ? { aceptaTratamiento: false, codigoVersion: codigo }
      : null;
  }
  if (typeof codigo !== 'string' || codigo.trim() === '') {
    return formatoInesperado(logger);
  }
  return {
    aceptaTratamiento:
      c.autorizaGrabacionVoz === true && c.requiereAceptarTerminos !== true,
    codigoVersion: codigo,
  };
}

/**
 * La respuesta trae el id_usuario en `idUsuarioAuth` (texto) y/o
 * `id_usuario` (número). Debe venir al menos uno, y todos los que vengan
 * deben ser el pedido.
 */
function mismoUsuario(
  c: { id_usuario?: unknown; idUsuarioAuth?: unknown },
  idUsuarioAuth: bigint,
): boolean {
  const presentes = [c.idUsuarioAuth, c.id_usuario].filter(
    (v) => v !== undefined && v !== null,
  );
  return (
    presentes.length > 0 && presentes.every((v) => mismoId(v, idUsuarioAuth))
  );
}

function mismoId(valor: unknown, esperado: bigint): boolean {
  if (typeof valor === 'number' && Number.isSafeInteger(valor)) {
    return BigInt(valor) === esperado;
  }
  if (typeof valor === 'string' && /^\d{1,19}$/.test(valor)) {
    return BigInt(valor) === esperado;
  }
  return false;
}

function formatoInesperado(logger: Logger): never {
  logger.warn('La respuesta de /consentimiento tiene un formato inesperado');
  throw new ServicioExternoNoDisponibleError(
    'ASISCO UP respondió el consentimiento con un formato inesperado.',
  );
}
