import { Logger } from '@nestjs/common';
import { ServicioExternoNoDisponibleError } from '../../../common/errors/dominio.errors.js';
import type {
  ConsentimientoVigente,
  ConsultaConsentimiento,
} from '../domain/consulta-consentimiento.js';

/**
 * Lee el consentimiento informado de ASISCO UP:
 *   GET <base>/api/estudiantes/{idEstudiante}/consentimiento
 *
 * Respuesta de ASISCO UP con la versión v1.1-2026 (datos + voz), 2026-11-08:
 *   { idEstudiante, versionVigente: { idVersionTerminos, codigoVersion, textoLegal },
 *     tieneConsentimientoVigente, autorizaGrabacionVoz,
 *     requiereAceptarTerminos, consentimientos[] }
 *   404 { error } si el estudiante no existe.
 *
 * Regla para grabar la voz (todas a la vez): tieneConsentimientoVigente,
 * autorizaGrabacionVoz === true y requiereAceptarTerminos !== true. Si el
 * acudiente aceptó los datos pero no la voz, el niño usa GameUP normalmente
 * y solo no se guarda audio. Si falta autorizaGrabacionVoz (versión vieja de
 * la API), se toma como "no autoriza".
 *
 * Nunca registra datos del estudiante: solo el código de estado.
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
    idEstudianteExterno: bigint,
  ): Promise<ConsentimientoVigente | null> {
    const url = `${this.baseUrl}/api/estudiantes/${idEstudianteExterno.toString()}/consentimiento`;

    let respuesta: Response;
    try {
      respuesta = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      this.logger.warn('ASISCO UP no respondió a /consentimiento');
      throw new ServicioExternoNoDisponibleError(
        'No se puede consultar el consentimiento: ASISCO UP no responde.',
      );
    }

    // Estudiante desconocido en ASISCO UP: no hay consentimiento.
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
    return interpretarRespuesta(cuerpo, idEstudianteExterno, this.logger);
  }
}

function interpretarRespuesta(
  cuerpo: unknown,
  idPedido: bigint,
  logger: Logger,
): ConsentimientoVigente | null {
  if (typeof cuerpo !== 'object' || cuerpo === null) {
    return formatoInesperado(logger);
  }
  const c = cuerpo as {
    idEstudiante?: unknown;
    tieneConsentimientoVigente?: unknown;
    autorizaGrabacionVoz?: unknown;
    requiereAceptarTerminos?: unknown;
    versionVigente?: { codigoVersion?: unknown } | null;
  };
  if (typeof c.tieneConsentimientoVigente !== 'boolean') {
    return formatoInesperado(logger);
  }
  // ASISCO UP acepta en la ruta varios tipos de id (el suyo, el de la API de
  // seguridad o el documento). Si responde por otro estudiante, no se usa:
  // podría ser el permiso de otro niño.
  if (!mismoEstudiante(c.idEstudiante, idPedido)) {
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

function mismoEstudiante(valor: unknown, idPedido: bigint): boolean {
  if (typeof valor === 'number' && Number.isSafeInteger(valor)) {
    return BigInt(valor) === idPedido;
  }
  if (typeof valor === 'string' && /^\d{1,19}$/.test(valor)) {
    return BigInt(valor) === idPedido;
  }
  return false;
}

function formatoInesperado(logger: Logger): never {
  logger.warn('La respuesta de /consentimiento tiene un formato inesperado');
  throw new ServicioExternoNoDisponibleError(
    'ASISCO UP respondió el consentimiento con un formato inesperado.',
  );
}
