import { env } from '../config/env';
import { REQUEST_TIMEOUT_MS, UPLOAD_TIMEOUT_MS } from '../config/http';
import {
  ConnectionError,
  ForbiddenError,
  NotFoundError,
  ServerError,
  UnauthorizedError,
  type ApiError,
} from './apiErrors';

/**
 * Cliente HTTP de la API NestJS. Todas las peticiones de la app pasan por
 * aquí: pone la URL base, el token, el tiempo de espera y convierte las
 * respuestas de error en errores tipados (`./apiErrors`). No conoce los
 * datos de la app: eso es trabajo de los repositorios y sus mapeadores.
 */
export interface ApiClient {
  get<T>(path: string, options?: RequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  /** DELETE sin cuerpo (por ejemplo, quitar una asignación; responde 204). */
  delete<T>(path: string, options?: RequestOptions): Promise<T>;
  /**
   * POST `multipart/form-data` (por ejemplo, un audio). `fetch` pone la
   * cabecera con su separador; espera más, porque sube un archivo.
   */
  postForm<T>(
    path: string,
    form: FormData,
    options?: RequestOptions,
  ): Promise<T>;
}

export interface RequestOptions {
  /**
   * `false`: petición pública, sin token (iniciar sesión, salud).
   * Por defecto, `true`.
   */
  authenticated?: boolean;
}

export interface ApiClientConfig {
  /** URL base, sin "/" final. Ej.: http://192.168.1.20:3000/api/v1 */
  baseUrl: string;
  /** Token de la sesión, o `null` si no hay. */
  getToken: () => Promise<string | null>;
  /**
   * Se llama cuando una petición con sesión recibe 401 (o no hay token):
   * la sesión terminó. Quien arma la app decide qué hacer (volver al login).
   */
  onUnauthorized?: () => void;
  timeoutMs?: number;
  /** Para las pruebas. Por defecto, el `fetch` global. */
  fetchFn?: typeof fetch;
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

/** Qué lleva el cuerpo de la petición. */
type Payload =
  | { kind: 'none' }
  | { kind: 'json'; value: unknown }
  | { kind: 'form'; value: FormData };

const NO_BODY: Payload = { kind: 'none' };
const json = (value: unknown): Payload =>
  value === undefined ? NO_BODY : { kind: 'json', value };

/** El backend responde los errores como `{ statusCode, error, message }`. */
function messageFrom(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const { message } = body as { message: unknown };
    if (typeof message === 'string') return message;
  }
  return `El servidor respondió con el código ${status}`;
}

function errorFor(status: number, body: unknown): ApiError {
  const message = messageFrom(body, status);
  switch (status) {
    case 401:
      return new UnauthorizedError(message);
    case 403:
      return new ForbiddenError(message);
    case 404:
      return new NotFoundError(message);
    default:
      return new ServerError(message, status);
  }
}

function parseJson(text: string): unknown {
  if (text.length === 0) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export function createApiClient({
  baseUrl,
  getToken,
  onUnauthorized,
  timeoutMs = REQUEST_TIMEOUT_MS,
  fetchFn,
}: ApiClientConfig): ApiClient {
  async function request<T>(
    method: Method,
    path: string,
    payload: Payload,
    { authenticated = true }: RequestOptions = {},
    waitMs = timeoutMs,
  ): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    // En multipart no se pone Content-Type: `fetch` agrega el separador.
    if (payload.kind === 'json') headers['Content-Type'] = 'application/json';
    if (authenticated) {
      const token = await getToken();
      if (!token) {
        onUnauthorized?.();
        throw new UnauthorizedError('No hay una sesión iniciada');
      }
      headers.Authorization = `Bearer ${token}`;
    }

    if (!baseUrl) {
      throw new ConnectionError(
        'No está configurada EXPO_PUBLIC_API_URL en el archivo .env',
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), waitMs);
    let response: Response;
    try {
      response = await (fetchFn ?? fetch)(`${baseUrl}${path}`, {
        method,
        headers,
        body:
          payload.kind === 'json'
            ? JSON.stringify(payload.value)
            : payload.kind === 'form'
              ? payload.value
              : undefined,
        signal: controller.signal,
      });
    } catch {
      // Sin red, servidor apagado o tiempo de espera agotado.
      throw new ConnectionError();
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text().catch(() => '');
    const data = parseJson(text);
    if (!response.ok) {
      const error = errorFor(response.status, data);
      if (authenticated && error instanceof UnauthorizedError) {
        onUnauthorized?.();
      }
      throw error;
    }
    if (text.length > 0 && data === undefined) {
      throw new ServerError(
        'La respuesta del servidor no es JSON',
        response.status,
      );
    }
    return data as T;
  }

  return {
    get: (path, options) => request('GET', path, NO_BODY, options),
    post: (path, body, options) => request('POST', path, json(body), options),
    put: (path, body, options) => request('PUT', path, json(body), options),
    delete: (path, options) => request('DELETE', path, NO_BODY, options),
    postForm: (path, form, options) =>
      request(
        'POST',
        path,
        { kind: 'form', value: form },
        options,
        UPLOAD_TIMEOUT_MS,
      ),
  };
}

/** Cliente sin sesión para rutas públicas (prueba de conexión). */
const publicClient = createApiClient({
  baseUrl: env.apiUrl,
  getToken: () => Promise.resolve(null),
});

/** GET público. Lo usa la prueba de conexión (`health.service.ts`). */
export function apiGet<T>(path: string): Promise<T> {
  return publicClient.get<T>(path, { authenticated: false });
}
