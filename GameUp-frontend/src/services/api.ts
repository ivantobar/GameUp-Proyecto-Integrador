import { env } from '../config/env';

/** Tiempo máximo de espera por respuesta del backend. */
const TIMEOUT_MS = 8000;

/**
 * Cliente HTTP mínimo para hablar con la API NestJS.
 * Todas las peticiones de la app deben pasar por aquí.
 */
export async function apiGet<T>(path: string): Promise<T> {
  if (!env.apiUrl) {
    throw new Error(
      'No está configurada EXPO_PUBLIC_API_URL en el archivo .env',
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${env.apiUrl}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`El servidor respondió con el código ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        'El servidor no respondió. Revisa la IP, que el backend esté encendido y que estés en la misma red Wi-Fi.',
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
