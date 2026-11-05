/**
 * `fetch` simulado para las pruebas de los repositorios HTTP. Ninguna prueba
 * llama a Render ni a otra API real.
 */
export interface FakeRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

export type FakeHandler = (
  request: FakeRequest,
) => Response | Promise<Response>;

/** Respuesta con cuerpo JSON (o vacía, si `body` es `undefined`). */
export function jsonResponse(status: number, body?: unknown): Response {
  const text = body === undefined ? '' : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(text),
  } as unknown as Response;
}

/** Error como lo responde el backend: `{ statusCode, error, message }`. */
export function errorResponse(status: number, message: string): Response {
  return jsonResponse(status, { statusCode: status, error: 'Error', message });
}

export function createFakeFetch(handler: FakeHandler) {
  const requests: FakeRequest[] = [];
  const fetchFn = jest.fn(async (input: unknown, init?: RequestInit) => {
    const request: FakeRequest = {
      url: String(input),
      method: init?.method ?? 'GET',
      headers: { ...(init?.headers as Record<string, string> | undefined) },
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    };
    requests.push(request);
    return handler(request);
  });
  return { fetchFn: fetchFn as unknown as typeof fetch, requests };
}
