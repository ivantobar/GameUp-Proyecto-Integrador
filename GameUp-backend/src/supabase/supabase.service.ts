import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { EnvironmentVariables } from '../config/env.validation.js';

export type SupabaseStatus = 'no_configurado' | 'conectado' | 'error';

/** Bucket que se consulta en el health: el de las grabaciones de voz. */
export const BUCKET_REVISADO = 'grabaciones';

/** Milisegundos que se recuerda el resultado (el health es público y frecuente). */
export const DURACION_CACHE_ESTADO_MS = 60_000;

/**
 * Cliente de Supabase del lado del servidor.
 *
 * Usa la clave secreta, que se salta las políticas RLS. Por eso:
 *  - solo se usa dentro del backend;
 *  - los permisos por rol se verifican en NestJS antes de cada consulta.
 */
@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private readonly client: SupabaseClient | null;
  private estadoEnCache: { estado: SupabaseStatus; venceEn: number } | null =
    null;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    const url = config.get('SUPABASE_URL', { infer: true });
    const key = config.get('SUPABASE_SECRET_KEY', { infer: true });

    if (url && key) {
      this.client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    } else {
      this.client = null;
      this.logger.warn(
        'Supabase no está configurado (faltan SUPABASE_URL o SUPABASE_SECRET_KEY en .env).',
      );
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  /** Devuelve el cliente o responde 503 si Supabase no está configurado. */
  getClient(): SupabaseClient {
    if (!this.client) {
      throw new ServiceUnavailableException('Supabase no está configurado');
    }
    return this.client;
  }

  /**
   * Comprueba que la URL y la clave secreta funcionan leyendo los datos del
   * bucket `grabaciones` (no toca usuarios ni archivos). Devuelve `error` si
   * no responde o si el bucket es PÚBLICO: las voces de los niños solo
   * pueden salir con URL firmada. El resultado se recuerda 60 s, porque el
   * health es público y Render lo consulta seguido.
   */
  async checkConnection(): Promise<SupabaseStatus> {
    if (!this.client) return 'no_configurado';
    const ahora = Date.now();
    if (this.estadoEnCache && this.estadoEnCache.venceEn > ahora) {
      return this.estadoEnCache.estado;
    }
    const estado = await this.consultarBucket(this.client);
    this.estadoEnCache = { estado, venceEn: ahora + DURACION_CACHE_ESTADO_MS };
    return estado;
  }

  private async consultarBucket(
    client: SupabaseClient,
  ): Promise<SupabaseStatus> {
    try {
      const { data, error } = await client.storage.getBucket(BUCKET_REVISADO);
      if (error || !data) {
        this.logger.error(
          `Error al conectar con Supabase Storage: ${error?.message ?? 'sin datos'}`,
        );
        return 'error';
      }
      if (data.public) {
        this.logger.error(
          `El bucket ${BUCKET_REVISADO} es PÚBLICO: debe ser privado (las grabaciones solo salen con URL firmada).`,
        );
        return 'error';
      }
      return 'conectado';
    } catch (err) {
      this.logger.error(
        `Error al conectar con Supabase Storage: ${err instanceof Error ? err.name : 'desconocido'}`,
      );
      return 'error';
    }
  }
}
