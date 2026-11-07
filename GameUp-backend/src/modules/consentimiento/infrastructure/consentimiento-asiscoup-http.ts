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
 * Respuesta real observada el 2026-11-07:
 *   { idEstudiante, versionVigente: { idVersionTerminos, codigoVersion },
 *     tieneConsentimientoVigente, requiereAceptarTerminos, consentimientos[] }
 *   404 { error } si el estudiante no existe.
 *
 * OJO: es el consentimiento de TRATAMIENTO DE DATOS. El texto legal v1.0-2026
 * no menciona la grabación de voz, así que este adaptador todavía NO se
 * conecta a la verificación de voz (ConsentimientoModule sigue usando
 * ConsultaConsentimientoNoDisponible). Falta decidir dónde vive la
 * autorización específica de voz.
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
    return interpretarRespuesta(cuerpo, this.logger);
  }
}

function interpretarRespuesta(
  cuerpo: unknown,
  logger: Logger,
): ConsentimientoVigente | null {
  if (typeof cuerpo !== 'object' || cuerpo === null) {
    return formatoInesperado(logger);
  }
  const c = cuerpo as {
    tieneConsentimientoVigente?: unknown;
    requiereAceptarTerminos?: unknown;
    versionVigente?: { codigoVersion?: unknown } | null;
  };
  if (typeof c.tieneConsentimientoVigente !== 'boolean') {
    return formatoInesperado(logger);
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
  // Si hay términos nuevos sin aceptar, el consentimiento no está al día.
  return {
    aceptaTratamiento: c.requiereAceptarTerminos !== true,
    codigoVersion: codigo,
  };
}

function formatoInesperado(logger: Logger): never {
  logger.warn('La respuesta de /consentimiento tiene un formato inesperado');
  throw new ServicioExternoNoDisponibleError(
    'ASISCO UP respondió el consentimiento con un formato inesperado.',
  );
}
