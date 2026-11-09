import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mapearPerfil } from '../../../common/auth/seguridad-api/perfil.mapper.js';
import type { IdentidadExterna } from '../../../common/auth/verificador-token.js';
import { ServicioExternoNoDisponibleError } from '../../../common/errors/dominio.errors.js';
import type { EnvironmentVariables } from '../../../config/env.validation.js';
import type { DirectorioCentral } from '../domain/directorio-central.js';

export const RUTA_USUARIOS = '/api/usuarios';

/**
 * Adaptador de DirectorioCentral sobre la API central de seguridad:
 *   GET <SEGURIDAD_API_URL>/api/usuarios/{idUsuarioAuth}
 *   (Authorization: Bearer <JWT de la directora>)
 *
 * Forma real (probada el 2026-11-09 con el token ADMIN de prueba): la misma
 * que GET /api/auth/perfil, así que se reutiliza mapearPerfil:
 *   200 { id_usuario, nombres, apellidos, correo_usuario, roles: [{ id_rol,
 *         nombre_rol }], ...documento, teléfono, dirección, fecha de nacimiento }
 *   404 { error: "Recurso no encontrado" }
 *   401 { error } sin token.
 * mapearPerfil descarta documento, teléfono, dirección y fecha de nacimiento.
 *
 * Si responde por otra persona (id_usuario distinto), no se usa.
 * Nunca registra datos de la persona ni el token: solo el código de estado.
 */
@Injectable()
export class DirectorioCentralHttp implements DirectorioCentral {
  private readonly logger = new Logger(DirectorioCentralHttp.name);
  private readonly baseUrl: string | undefined;
  private readonly timeoutMs: number;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.baseUrl = config
      .get('SEGURIDAD_API_URL', { infer: true })
      ?.replace(/\/+$/, '');
    this.timeoutMs = config.get('SEGURIDAD_API_TIMEOUT_MS', { infer: true });
  }

  async buscar(
    idUsuarioAuth: bigint,
    token: string,
  ): Promise<IdentidadExterna | null> {
    if (!this.baseUrl) {
      throw new ServicioExternoNoDisponibleError(
        'No se puede consultar la API central: falta configurar SEGURIDAD_API_URL.',
      );
    }

    let respuesta: Response;
    try {
      respuesta = await fetch(
        `${this.baseUrl}${RUTA_USUARIOS}/${idUsuarioAuth.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(this.timeoutMs),
        },
      );
    } catch {
      this.logger.warn('La API central no respondió a /api/usuarios/{id}');
      throw new ServicioExternoNoDisponibleError(
        'La API central no responde. Intenta de nuevo en unos minutos.',
      );
    }

    if (respuesta.status === 404) return null;
    if (!respuesta.ok) {
      this.logger.warn(
        `La API central respondió ${respuesta.status} a /api/usuarios/{id}`,
      );
      throw new ServicioExternoNoDisponibleError(
        'No se pudo consultar a la persona en la API central.',
      );
    }

    let cuerpo: unknown;
    try {
      cuerpo = await respuesta.json();
    } catch {
      cuerpo = null;
    }
    const identidad = mapearPerfil(cuerpo);
    if (!identidad) {
      this.logger.warn(
        'La respuesta de /api/usuarios/{id} no tiene la forma esperada',
      );
      throw new ServicioExternoNoDisponibleError(
        'La API central respondió con un formato inesperado.',
      );
    }
    if (identidad.idUsuarioAuth !== idUsuarioAuth) {
      this.logger.warn('La API central respondió por otra persona');
      throw new ServicioExternoNoDisponibleError(
        'La API central respondió por otra persona.',
      );
    }
    return identidad;
  }
}
