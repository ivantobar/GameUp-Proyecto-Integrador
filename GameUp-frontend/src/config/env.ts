/**
 * Configuración leída de las variables de entorno (.env).
 *
 * Expo solo incluye en la app las variables que empiezan por EXPO_PUBLIC_
 * y deben leerse escribiendo el nombre completo (process.env.EXPO_PUBLIC_...).
 * Si se cambia el .env, hay que reiniciar con: npx expo start --clear
 */

/**
 * De dónde salen los datos:
 * - `mock`: datos ficticios en memoria (no hace falta el backend);
 * - `api`: la API NestJS de `EXPO_PUBLIC_API_URL`.
 */
export type DataSource = 'mock' | 'api';

/**
 * Por qué la URL de la API no sirve:
 * - `missing`: está vacía;
 * - `insecure`: fuera de desarrollo no empieza por `https://`.
 */
export type ApiUrlProblem = 'missing' | 'insecure';

/**
 * Elige el origen de los datos.
 *
 * Fuera de desarrollo es **siempre** `api`, diga lo que diga la variable: una
 * versión publicada nunca muestra datos ficticios ni acepta las cuentas de
 * prueba. En desarrollo, cualquier valor distinto de `api` usa los simulados.
 */
export function parseDataSource(
  value: string | undefined,
  isDev: boolean,
): DataSource {
  if (!isDev) return 'api';
  return value?.trim().toLowerCase() === 'api' ? 'api' : 'mock';
}

/**
 * Revisa la URL de la API. Devuelve `null` si sirve.
 *
 * Fuera de desarrollo exige `https://` (sin importar mayúsculas). En
 * desarrollo también acepta `http://` con la IP local del PC.
 */
export function checkApiUrl(
  value: string | undefined,
  isDev: boolean,
): ApiUrlProblem | null {
  const url = value?.trim() ?? '';
  if (!url) return 'missing';
  const scheme = url.toLowerCase();
  if (scheme.startsWith('https://')) return null;
  if (isDev && scheme.startsWith('http://')) return null;
  return 'insecure';
}

/** URL base sin espacios ni "/" final. */
export function normalizeApiUrl(value: string | undefined): string {
  return (value ?? '').trim().replace(/\/+$/, '');
}

const isDev = __DEV__;
const rawApiUrl = process.env.EXPO_PUBLIC_API_URL;
const dataSource = parseDataSource(process.env.EXPO_PUBLIC_DATA_SOURCE, isDev);
const apiUrlProblem = checkApiUrl(rawApiUrl, isDev);

if (isDev && apiUrlProblem) {
  console.warn(
    '[GameUP] Falta EXPO_PUBLIC_API_URL o no es http(s)://. Copia .env.example como .env y reinicia Expo.',
  );
}

export const env = {
  /** URL base de la API, sin "/" final. Ej.: https://gameup-backend.onrender.com/api/v1 */
  apiUrl: normalizeApiUrl(rawApiUrl),
  /** En desarrollo, por defecto `mock`. Fuera de desarrollo, siempre `api`. */
  dataSource,
  /**
   * Si la app no puede funcionar con esta configuración. Solo se bloquea
   * fuera de desarrollo: en desarrollo, `mock` funciona sin URL.
   */
  configProblem: isDev ? null : apiUrlProblem,
};
