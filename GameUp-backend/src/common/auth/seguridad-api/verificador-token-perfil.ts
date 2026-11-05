import { createHash } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../../config/env.validation.js';
import {
  NoAutenticadoError,
  ServicioExternoNoDisponibleError,
} from '../../errors/dominio.errors.js';
import { RELOJ, type Reloj } from '../../reloj/reloj.js';
import type {
  IdentidadExterna,
  VerificadorToken,
} from '../verificador-token.js';
import { leerExpiracionJwt } from './jwt.js';
import { mapearPerfil } from './perfil.mapper.js';

interface EntradaCache {
  identidad: IdentidadExterna;
  /** Milisegundos (epoch) hasta cuando sirve. */
  venceEn: number;
}

/** Tope de entradas en memoria para que la caché no crezca sin límite. */
const MAXIMO_ENTRADAS = 1000;

export const RUTA_PERFIL = '/api/auth/perfil';

/**
 * Adaptador de VerificadorToken: pregunta a la API de seguridad
 * (GET /api/auth/perfil con el mismo token) y recuerda la respuesta.
 *
 * Caché: la clave es el SHA-256 del token (nunca el token). Dura lo menor
 * entre AUTH_CACHE_TTL_SEG (máx. 5 min) y el `exp` del JWT. Un token
 * revocado en la API de seguridad puede seguir sirviendo hasta ese plazo.
 */
@Injectable()
export class VerificadorTokenPerfil implements VerificadorToken {
  private readonly logger = new Logger(VerificadorTokenPerfil.name);
  private readonly cache = new Map<string, EntradaCache>();
  private readonly baseUrl: string | undefined;
  private readonly timeoutMs: number;
  private readonly ttlMs: number;

  constructor(
    config: ConfigService<EnvironmentVariables, true>,
    @Inject(RELOJ) private readonly reloj: Reloj,
  ) {
    this.baseUrl = config
      .get('SEGURIDAD_API_URL', { infer: true })
      ?.replace(/\/+$/, '');
    this.timeoutMs = config.get('SEGURIDAD_API_TIMEOUT_MS', { infer: true });
    this.ttlMs = config.get('AUTH_CACHE_TTL_SEG', { infer: true }) * 1000;
  }

  async verificar(token: string): Promise<IdentidadExterna> {
    const ahora = this.reloj.ahora().getTime();
    const expiracion = leerExpiracionJwt(token)?.getTime();
    if (expiracion !== undefined && expiracion <= ahora) {
      throw new NoAutenticadoError('Tu sesión venció. Inicia sesión de nuevo.');
    }

    const clave = createHash('sha256').update(token).digest('hex');
    const enCache = this.cache.get(clave);
    if (enCache && enCache.venceEn > ahora) return enCache.identidad;
    this.cache.delete(clave);

    const identidad = await this.consultarPerfil(token);

    const venceEn = Math.min(
      ahora + this.ttlMs,
      expiracion ?? Number.POSITIVE_INFINITY,
    );
    if (venceEn > ahora) this.guardar(clave, { identidad, venceEn }, ahora);
    return identidad;
  }

  private async consultarPerfil(token: string): Promise<IdentidadExterna> {
    if (!this.baseUrl) {
      throw new ServicioExternoNoDisponibleError(
        'No se puede verificar la sesión: falta configurar la API de seguridad (SEGURIDAD_API_URL).',
      );
    }

    let respuesta: Response;
    try {
      respuesta = await fetch(`${this.baseUrl}${RUTA_PERFIL}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      // Sin detalles: el error de red podría incluir la URL o cabeceras.
      this.logger.warn('La API de seguridad no respondió a /perfil');
      throw new ServicioExternoNoDisponibleError(
        'La API de seguridad no responde. Intenta de nuevo en unos minutos.',
      );
    }

    if (respuesta.status === 401 || respuesta.status === 403) {
      throw new NoAutenticadoError(
        'Tu sesión no es válida o venció. Inicia sesión de nuevo.',
      );
    }
    if (!respuesta.ok) {
      this.logger.warn(
        `La API de seguridad respondió ${respuesta.status} a /perfil`,
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
    const identidad = mapearPerfil(cuerpo);
    if (!identidad) {
      this.logger.warn('La respuesta de /perfil no tiene la forma esperada');
      throw new ServicioExternoNoDisponibleError(
        'La API de seguridad respondió con un formato inesperado.',
      );
    }
    return identidad;
  }

  private guardar(clave: string, entrada: EntradaCache, ahora: number): void {
    if (this.cache.size >= MAXIMO_ENTRADAS) {
      for (const [k, e] of this.cache) {
        if (e.venceEn <= ahora) this.cache.delete(k);
      }
      // Si sigue llena, sale la más antigua (Map conserva el orden de inserción).
      if (this.cache.size >= MAXIMO_ENTRADAS) {
        const masAntigua = this.cache.keys().next().value;
        if (masAntigua !== undefined) this.cache.delete(masAntigua);
      }
    }
    this.cache.set(clave, entrada);
  }
}
