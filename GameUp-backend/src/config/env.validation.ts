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
