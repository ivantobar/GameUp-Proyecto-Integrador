import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NoAutenticadoError,
  ServicioExternoNoDisponibleError,
} from '../../../common/errors/dominio.errors.js';
import type { EnvironmentVariables } from '../../../config/env.validation.js';
import type { AutenticadorExterno } from '../domain/autenticador-externo.js';

export const RUTA_LOGIN = '/api/auth/login';

export const MENSAJE_CREDENCIALES = 'Correo o contraseña incorrectos.';

/**
 * Adaptador de AutenticadorExterno: POST <SEGURIDAD_API_URL>/api/auth/login
 * con { correo_usuario, contraseña_usuario } y lee el JWT del campo `token`
 * (así lo usa la colección Postman del otro grupo).
 *
 * Nunca registra el correo, la contraseña ni el token.
 */
@Injectable()
export class AutenticadorSeguridadHttp implements AutenticadorExterno {
  private readonly logger = new Logger(AutenticadorSeguridadHttp.name);
  private readonly baseUrl: string | undefined;
  private readonly timeoutMs: number;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.baseUrl = config
      .get('SEGURIDAD_API_URL', { infer: true })
      ?.replace(/\/+$/, '');
    this.timeoutMs = config.get('SEGURIDAD_API_TIMEOUT_MS', { infer: true });
  }

  async iniciarSesion(correo: string, contrasena: string): Promise<string> {
    if (!this.baseUrl) {
      throw new ServicioExternoNoDisponibleError(
        'No se puede iniciar sesión: falta configurar la API de seguridad (SEGURIDAD_API_URL).',
      );
    }

    let respuesta: Response;
    try {
      respuesta = await fetch(`${this.baseUrl}${RUTA_LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          correo_usuario: correo,
          contraseña_usuario: contrasena,
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      this.logger.warn('La API de seguridad no respondió a /login');
      throw new ServicioExternoNoDisponibleError(
        'La API de seguridad no responde. Intenta de nuevo en unos minutos.',
      );
    }

    // No se distingue "no existe" de "contraseña mala": no se revela qué correos existen.
    if ([400, 401, 403, 404].includes(respuesta.status)) {
      throw new NoAutenticadoError(MENSAJE_CREDENCIALES);
    }
    if (!respuesta.ok) {
      this.logger.warn(
        `La API de seguridad respondió ${respuesta.status} a /login`,
      );
      throw new ServicioExternoNoDisponibleError(
        'La API de seguridad no está disponible. Intenta de nuevo en unos minutos.',
      );
    }

    let cuerpo: unknown;
    try {
      cuerpo = await respuesta.json();
    } catch {
      cuerpo = null;
    }
    const token =
      typeof cuerpo === 'object' && cuerpo !== null
        ? (cuerpo as { token?: unknown }).token
        : undefined;
    if (typeof token !== 'string' || token.trim() === '') {
      this.logger.warn('La respuesta de /login no trae el campo token');
      throw new ServicioExternoNoDisponibleError(
        'La API de seguridad respondió con un formato inesperado.',
      );
    }
    return token;
  }
}
