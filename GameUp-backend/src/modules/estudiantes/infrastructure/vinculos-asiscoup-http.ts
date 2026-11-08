import { Logger } from '@nestjs/common';
import { ServicioExternoNoDisponibleError } from '../../../common/errors/dominio.errors.js';
import type {
  ConsultaVinculos,
  VinculoExterno,
  VinculosDeAcudiente,
} from '../domain/vinculos-externos.js';

/**
 * Lee los estudiantes vinculados al acudiente que inició sesión:
 *   GET <base>/api/acudientes/me/estudiantes   (Authorization: Bearer <JWT de seguridad>)
 *
 * Respuesta real observada el 2026-11-08 (datos de prueba):
 *   { acudiente: { idAcudiente, idUsuarioAuth: "15", id_usuario: 15, ... },
 *     estudiantes: [ { idEstudiante: 12, esPrincipal: true,
 *                      parentesco: { idParentesco: 1, nombre: "Madre" }, ... } ] }
 *
 * Solo toma ids, parentesco y principal: el resto (nombre, documento,
 * diagnóstico, fecha de nacimiento) se ignora y nunca se registra en logs.
 */
export class ConsultaVinculosAsiscoUpHttp implements ConsultaVinculos {
  private readonly logger = new Logger(ConsultaVinculosAsiscoUpHttp.name);
  private readonly baseUrl: string;

  constructor(
    baseUrl: string,
    private readonly timeoutMs: number,
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async deAcudiente(token: string): Promise<VinculosDeAcudiente> {
    let respuesta: Response;
    try {
      respuesta = await fetch(`${this.baseUrl}/api/acudientes/me/estudiantes`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      this.logger.warn('ASISCO UP no respondió a /acudientes/me/estudiantes');
      throw new ServicioExternoNoDisponibleError(
        'No se pueden consultar los vínculos: ASISCO UP no responde.',
      );
    }
    if (!respuesta.ok) {
      this.logger.warn(
        `ASISCO UP respondió ${respuesta.status} a /acudientes/me/estudiantes`,
      );
      throw new ServicioExternoNoDisponibleError(
        'No se pueden consultar los vínculos en ASISCO UP.',
      );
    }
    let cuerpo: unknown;
    try {
      cuerpo = await respuesta.json();
    } catch {
      cuerpo = null;
    }
    return interpretar(cuerpo, this.logger);
  }
}

type Objeto = Record<string, unknown>;
const esObjeto = (v: unknown): v is Objeto =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function id(valor: unknown): bigint | null {
  if (typeof valor === 'number' && Number.isSafeInteger(valor) && valor > 0) {
    return BigInt(valor);
  }
  if (typeof valor === 'string' && /^[1-9]\d{0,18}$/.test(valor)) {
    return BigInt(valor);
  }
  return null;
}

function interpretar(cuerpo: unknown, logger: Logger): VinculosDeAcudiente {
  if (!esObjeto(cuerpo) || !esObjeto(cuerpo.acudiente)) {
    return formatoInesperado(logger);
  }
  const idUsuarioAuth =
    id(cuerpo.acudiente.idUsuarioAuth) ?? id(cuerpo.acudiente.id_usuario);
  if (idUsuarioAuth === null || !Array.isArray(cuerpo.estudiantes)) {
    return formatoInesperado(logger);
  }
  const estudiantes: VinculoExterno[] = [];
  for (const e of cuerpo.estudiantes) {
    if (!esObjeto(e)) return formatoInesperado(logger);
    const idEstudiante = id(e.idEstudiante);
    if (idEstudiante === null) return formatoInesperado(logger);
    const nombre = esObjeto(e.parentesco) ? e.parentesco.nombre : e.parentesco;
    estudiantes.push({
      idEstudianteExterno: idEstudiante,
      parentesco:
        typeof nombre === 'string' && nombre.trim() !== ''
          ? nombre.trim()
          : 'Acudiente',
      esPrincipal: e.esPrincipal === true,
    });
  }
  return { idUsuarioAuth, estudiantes };
}

function formatoInesperado(logger: Logger): never {
  logger.warn(
    'La respuesta de /acudientes/me/estudiantes tiene un formato inesperado',
  );
  throw new ServicioExternoNoDisponibleError(
    'ASISCO UP respondió los vínculos con un formato inesperado.',
  );
}
