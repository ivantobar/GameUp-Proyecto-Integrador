import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * Variables de entorno que acepta el backend.
 * Si alguna falta o tiene un formato inválido, la app no arranca y muestra el error.
 */
export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  /**
   * Cadena de conexión de PostgreSQL que usa Prisma (igual que en clase).
   * Local:    postgresql://usuario:clave@localhost:5432/gameup
   * Supabase: la cadena "Session pooler" del proyecto.
   */
  @IsString()
  @Matches(/^postgres(ql)?:\/\//, {
    message: 'DATABASE_URL debe empezar por postgresql://',
  })
  DATABASE_URL!: string;

  /**
   * Orígenes web permitidos, separados por comas.
   * La app móvil (Expo Go) NO lo necesita; solo sirve si se prueba en navegador.
   */
  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;

  /**
   * URL pública del backend cuando se despliegue (aparece como servidor
   * "Producción" en Swagger). Ej.: https://gameup-backend.onrender.com
   */
  @IsOptional()
  @IsUrl({ require_tld: false, protocols: ['http', 'https'] })
  PUBLIC_URL?: string;

  /**
   * Cantidad de proxies delante del backend (Render, Railway, Nginx...).
   * Permite que Express lea la IP real del cliente. 0 en local.
   */
  @IsInt()
  @Min(0)
  TRUST_PROXY_HOPS: number = 0;

  /** URL del proyecto de Supabase (para Auth y Storage): https://<ref>.supabase.co */
  @IsOptional()
  @IsUrl({ require_tld: false, protocols: ['http', 'https'] })
  SUPABASE_URL?: string;

  /**
   * Clave secreta de Supabase (sb_secret_... o la antigua service_role).
   * SOLO vive en el backend: nunca debe llegar a la app móvil.
   */
  @IsOptional()
  @IsString()
  SUPABASE_SECRET_KEY?: string;

  /**
   * URL base de la API de seguridad (login y perfil), sin /api al final.
   * Ej.: https://seguridad.ejemplo.com  →  se llama a /api/auth/perfil.
   * Si falta, el login y las rutas protegidas responden 503.
   */
  @IsOptional()
  @IsUrl({ require_tld: false, protocols: ['http', 'https'] })
  SEGURIDAD_API_URL?: string;

  /** Tiempo máximo de espera de cada llamada a la API de seguridad. */
  @IsInt()
  @Min(500)
  @Max(30000)
  SEGURIDAD_API_TIMEOUT_MS: number = 5000;

  /**
   * Segundos que se recuerda un token ya verificado (máximo 5 minutos).
   * Nunca supera la expiración (exp) del propio token.
   */
  @IsInt()
  @Min(0)
  @Max(300)
  AUTH_CACHE_TTL_SEG: number = 300;
}

export function validateEnv(config: Record<string, unknown>) {
  const env = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(env, { skipMissingProperties: false });
  const messages = errors.flatMap((e) =>
    // Si DATABASE_URL no existe, basta con un mensaje claro.
    e.property === 'DATABASE_URL' && !env.DATABASE_URL
      ? ['DATABASE_URL es obligatoria (revisa el archivo .env)']
      : Object.values(e.constraints ?? {}),
  );

  if (messages.length > 0) {
    throw new Error(
      `Variables de entorno inválidas:\n - ${messages.join('\n - ')}`,
    );
  }

  return env;
}
