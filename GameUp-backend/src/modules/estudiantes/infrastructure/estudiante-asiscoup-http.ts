import { Logger } from '@nestjs/common';
import { ServicioExternoNoDisponibleError } from '../../../common/errors/dominio.errors.js';
import type { ConsultaEstudianteExterno } from '../domain/estudiante-externo.js';
import { esObjeto, idAsisco } from './asiscoup-ids.js';

const RUTA = '/estudiantes/por-usuario';

/**
 * Busca al estudiante de ASISCO UP por el id_usuario de la API de seguridad:
 *   GET <base>/api/estudiantes/por-usuario/{idUsuarioAuth}
 *   (Authorization: Bearer <JWT del propio estudiante>)
 *
 * Es la ruta exacta por id_usuario (comprobada en el Swagger en vivo,
 * /api/docs.json, el 2026-11-08). NO se usa /api/estudiantes/{id}: acepta
 * tres tipos de id y ya confundió niños.
 *
 * Respuesta observada el 2026-11-08 (cuenta de prueba 13):
 *   200 { idEstudiante: 12, idUsuarioAuth: "13", id_usuario: 13, ...ficha }
 *   404 { error } si no hay estudiante con ese id_usuario.
 *
 * Solo lee idEstudiante e idUsuarioAuth. La ficha trae nombre, documento y
 * diagnóstico: se ignoran y nunca se registran en logs (solo el estado HTTP).
 */
export class ConsultaEstudianteAsiscoUpHttp implements ConsultaEstudianteExterno {
  private readonly logger = new Logger(ConsultaEstudianteAsiscoUpHttp.name);
  private readonly baseUrl: string;

  constructor(
    baseUrl: string,
    private readonly timeoutMs: number,
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async porIdUsuarioAuth(
    idUsuarioAuth: bigint,
    token: string,
  ): Promise<bigint | null> {
    const url = `${this.baseUrl}/api${RUTA}/${idUsuarioAuth.toString()}`;
    let respuesta: Response;
    try {
      respuesta = await fetch(url, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      this.logger.warn(`ASISCO UP no respondió a ${RUTA}`);
      throw new ServicioExternoNoDisponibleError(
        'No se puede consultar el estudiante: ASISCO UP no responde.',
      );
    }

    if (respuesta.status === 404) return null;
    if (!respuesta.ok) {
      this.logger.warn(`ASISCO UP respondió ${respuesta.status} a ${RUTA}`);
      throw new ServicioExternoNoDisponibleError(
        'No se puede consultar el estudiante en ASISCO UP.',
      );
    }

    let cuerpo: unknown;
    try {
      cuerpo = await respuesta.json();
    } catch {
      cuerpo = null;
    }
    if (!esObjeto(cuerpo)) return this.formatoInesperado();
    const idEstudiante = idAsisco(cuerpo.idEstudiante);
    if (idEstudiante === null) return this.formatoInesperado();

    // Solo se acepta si ASISCO UP confirma que es la misma persona.
    const idDeLaRespuesta =
      idAsisco(cuerpo.idUsuarioAuth) ?? idAsisco(cuerpo.id_usuario);
    if (idDeLaRespuesta !== idUsuarioAuth) {
      this.logger.warn(
        `ASISCO UP respondió ${RUTA} por otra cuenta (o sin idUsuarioAuth): se trata como no encontrado`,
      );
      return null;
    }
    return idEstudiante;
  }

  private formatoInesperado(): never {
    this.logger.warn(`La respuesta de ${RUTA} tiene un formato inesperado`);
    throw new ServicioExternoNoDisponibleError(
      'ASISCO UP respondió el estudiante con un formato inesperado.',
    );
  }
}
