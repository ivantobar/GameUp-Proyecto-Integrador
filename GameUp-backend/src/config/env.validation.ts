import 'reflect-metadata';
import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
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

  /**
   * SOLO DESARROLLO: si es "true", todos los estudiantes figuran con
   * consentimiento de voz aceptado (para probar Habla conmigo mientras no
   * exista la consulta en la API del núcleo familiar). Prohibido en producción.
   */
  @Transform(({ obj }: { obj: Record<string, unknown> }) =>
    booleanoEstricto(obj['CONSENTIMIENTO_SIMULADO']),
  )
  @IsBoolean({ message: 'CONSENTIMIENTO_SIMULADO debe ser true o false' })
  CONSENTIMIENTO_SIMULADO: boolean = false;

  /**
   * Cada cuántos minutos se borran de Storage las grabaciones ya validadas
   * que falten y las que vencieron (30 días sin validar). 0 la desactiva
   * (también corre al arrancar y tras cada validación).
   */
  @IsInt()
  @Min(0)
  @Max(1440)
  LIMPIEZA_GRABACIONES_MIN: number = 30;
}

/**
 * "true"/"false" → boolean. Con la conversión implícita de class-transformer,
 * el texto "false" se volvería true (Boolean("false")), así que se lee el
 * valor original. Cualquier otro valor lo rechaza @IsBoolean.
 */
function booleanoEstricto(valor: unknown): unknown {
  if (valor === undefined || valor === false || valor === 'false') return false;
  if (valor === true || valor === 'true') return true;
  return valor;
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

  if (
    env.NODE_ENV === Environment.Production &&
    env.CONSENTIMIENTO_SIMULADO === true
  ) {
    messages.push('CONSENTIMIENTO_SIMULADO no se puede activar en producción');
  }

  if (messages.length > 0) {
    throw new Error(
      `Variables de entorno inválidas:\n - ${messages.join('\n - ')}`,
    );
  }

  return env;
}
