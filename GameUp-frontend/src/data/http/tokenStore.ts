/**
 * Dónde se guarda el token de la sesión. La app guarda solo el token, nunca
 * la contraseña, y no lo escribe en los registros (logs).
 */
export interface TokenStore {
  get(): Promise<string | null>;
  set(token: string): Promise<void>;
  clear(): Promise<void>;
}

/** Token en memoria: para las pruebas. */
export function createMemoryTokenStore(
  initial: string | null = null,
): TokenStore {
  let token = initial;
  return {
    get: () => Promise.resolve(token),
    set: (value) => {
      token = value;
      return Promise.resolve();
    },
    clear: () => {
      token = null;
      return Promise.resolve();
    },
  };
}
