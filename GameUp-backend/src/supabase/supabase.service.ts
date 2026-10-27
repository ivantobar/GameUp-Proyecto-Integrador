import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { EnvironmentVariables } from '../config/env.validation.js';

export type SupabaseStatus = 'no_configurado' | 'conectado' | 'error';

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

  /** Comprueba que la URL y la clave secreta funcionan, sin leer datos personales. */
  async checkConnection(): Promise<SupabaseStatus> {
    if (!this.client) return 'no_configurado';
    try {
      const { error } = await this.client.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });
      if (error) {
        this.logger.error(`Error al conectar con Supabase: ${error.message}`);
        return 'error';
      }
      return 'conectado';
    } catch (err) {
      this.logger.error(`Error al conectar con Supabase: ${String(err)}`);
      return 'error';
    }
  }
}
