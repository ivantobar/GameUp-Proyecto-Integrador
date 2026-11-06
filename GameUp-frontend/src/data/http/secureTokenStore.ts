import * as SecureStore from 'expo-secure-store';
import type { TokenStore } from './tokenStore';

const TOKEN_KEY = 'gameup.sesion.token';

/**
 * Token guardado con `expo-secure-store` (Keychain en iPhone, Keystore en
 * Android), no en AsyncStorage. Se copia en memoria para no leer el
 * almacén seguro en cada petición.
 */
export function createSecureTokenStore(): TokenStore {
  // `undefined`: todavía no se ha leído del almacén.
  let cached: string | null | undefined;

  return {
    async get() {
      if (cached === undefined) {
        cached = await SecureStore.getItemAsync(TOKEN_KEY);
      }
      return cached;
    },
    async set(token) {
      cached = token;
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    },
    async clear() {
      cached = null;
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    },
  };
}
