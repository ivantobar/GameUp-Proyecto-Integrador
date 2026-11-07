import { env, type DataSource } from '@/config/env';
import { createApiClient } from '@/services/api';
import { createHttpRepositories } from './http/createHttpRepositories';
import { createSecureTokenStore } from './http/secureTokenStore';
import { createMockRepositories } from './mock/createMockRepositories';
import type { Repositories } from './repositories';

interface CreateRepositoriesOptions {
  /** Qué hacer cuando la sesión termina (401): volver a «Iniciar sesión». */
  onSessionExpired: () => void;
  /** Por defecto, `EXPO_PUBLIC_DATA_SOURCE`. */
  dataSource?: DataSource;
  /** Por defecto, `__DEV__`. Fuera de desarrollo nunca se usan los simulados. */
  isDev?: boolean;
}

/**
 * ÚNICO punto donde se elige de dónde salen los datos (`mock` o `api`).
 * Las pantallas y los hooks solo conocen las interfaces de `repositories.ts`.
 */
export function createRepositories({
  onSessionExpired,
  dataSource = env.dataSource,
  isDev = __DEV__,
}: CreateRepositoriesOptions): Repositories {
  // Segunda barrera: aunque alguien pase `mock`, una versión publicada
  // siempre habla con la API (las cuentas simuladas tienen la contraseña en
  // el código).
  if (isDev && dataSource === 'mock') return createMockRepositories();

  const tokens = createSecureTokenStore();
  const api = createApiClient({
    baseUrl: env.apiUrl,
    getToken: tokens.get,
    onUnauthorized: () => {
      tokens.clear().catch(() => {
        // Si no se pudo borrar, el backend lo seguirá rechazando con 401.
      });
      onSessionExpired();
    },
  });
  return createHttpRepositories(api, tokens);
}
