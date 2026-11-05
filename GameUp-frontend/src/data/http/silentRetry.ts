import { ConnectionError, ServerError } from '@/services/apiErrors';

/** Reintentos de un envío al terminar un juego (Regla 11). */
export const SUBMIT_ATTEMPTS = 3;
export const SUBMIT_RETRY_DELAY_MS = 1500;

/**
 * ¿Vale la pena volver a intentarlo? Solo si no hubo respuesta o el
 * servidor falló (5xx). Un 4xx (datos o permisos) no mejora al repetirlo.
 */
function isTransient(error: unknown): boolean {
  if (error instanceof ConnectionError) return true;
  return (
    error instanceof ServerError &&
    (error.status === null || error.status >= 500)
  );
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Regla 11: si el envío de un juego falla, el niño no ve un error técnico.
 * Se reintenta en silencio; si aun así falla, el error sube y la pantalla
 * celebra igual y deja un aviso para el adulto.
 */
export async function withSilentRetry<T>(
  send: () => Promise<T>,
  attempts = SUBMIT_ATTEMPTS,
  delayMs = SUBMIT_RETRY_DELAY_MS,
): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await send();
    } catch (error: unknown) {
      if (attempt >= attempts || !isTransient(error)) throw error;
      await wait(delayMs * attempt);
    }
  }
}
