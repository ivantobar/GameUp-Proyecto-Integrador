import { createApiClient } from '../api';
import {
  ConnectionError,
  ForbiddenError,
  NotFoundError,
  ServerError,
  UnauthorizedError,
} from '../apiErrors';
import {
  createFakeFetch,
  errorResponse,
  jsonResponse,
  type FakeHandler,
} from '@/test-utils/fakeFetch';

const BASE = 'http://api.prueba/api/v1';

function clientWith(
  handler: FakeHandler,
  { token = 'tok-123' as string | null, timeoutMs = 1000 } = {},
) {
  const fake = createFakeFetch(handler);
  const onUnauthorized = jest.fn();
  const api = createApiClient({
    baseUrl: BASE,
    getToken: () => Promise.resolve(token),
    onUnauthorized,
    timeoutMs,
    fetchFn: fake.fetchFn,
  });
  return { api, onUnauthorized, ...fake };
}

describe('cliente HTTP', () => {
  it('arma la URL y envía el token como Bearer', async () => {
    const { api, requests } = clientWith(() => jsonResponse(200, { ok: 1 }));

    await expect(api.get('/estudiantes/me')).resolves.toEqual({ ok: 1 });

    expect(requests[0]).toMatchObject({
      url: `${BASE}/estudiantes/me`,
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: 'Bearer tok-123' },
    });
  });

  it('envía JSON en POST y PUT', async () => {
    const { api, requests } = clientWith(() => jsonResponse(200, {}));

    await api.post('/x', { a: 1 });
    await api.put('/y', { b: 2 });

    expect(requests[0]).toMatchObject({
      method: 'POST',
      body: { a: 1 },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(requests[1]).toMatchObject({ method: 'PUT', body: { b: 2 } });
  });

  it('una petición pública no lleva token', async () => {
    const { api, requests } = clientWith(() => jsonResponse(200, {}), {
      token: null,
    });

    await api.post('/auth/login', {}, { authenticated: false });

    expect(requests[0]?.headers.Authorization).toBeUndefined();
  });

  it('una respuesta vacía (204) devuelve undefined', async () => {
    const { api } = clientWith(() => jsonResponse(204));
    await expect(api.post('/auth/logout')).resolves.toBeUndefined();
  });

  it('401 con sesión: avisa que la sesión terminó', async () => {
    const { api, onUnauthorized } = clientWith(() =>
      errorResponse(401, 'Token vencido'),
    );

    await expect(api.get('/auth/me')).rejects.toBeInstanceOf(UnauthorizedError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('401 en una petición pública no cierra la sesión', async () => {
    const { api, onUnauthorized } = clientWith(() =>
      errorResponse(401, 'Correo o contraseña incorrectos'),
    );

    await expect(
      api.post('/auth/login', {}, { authenticated: false }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('sin token no llama al servidor y avisa que no hay sesión', async () => {
    const { api, onUnauthorized, fetchFn } = clientWith(
      () => jsonResponse(200, {}),
      { token: null },
    );

    await expect(api.get('/auth/me')).rejects.toBeInstanceOf(UnauthorizedError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it.each([
    [403, ForbiddenError],
    [404, NotFoundError],
    [422, ServerError],
    [503, ServerError],
  ])(
    '%i se convierte en un error tipado con el mensaje del backend',
    async (status, ErrorType) => {
      const { api } = clientWith(() =>
        errorResponse(status, 'Mensaje del backend'),
      );

      const error = await api.get('/x').catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ErrorType);
      expect(error).toMatchObject({ status, message: 'Mensaje del backend' });
    },
  );

  it('sin red: ConnectionError', async () => {
    const { api } = clientWith(() => {
      throw new TypeError('Network request failed');
    });

    await expect(api.get('/x')).rejects.toBeInstanceOf(ConnectionError);
  });

  it('si el servidor no responde a tiempo: ConnectionError', async () => {
    // Nunca responde; solo termina cuando el cliente cancela la petición.
    const fetchFn = jest.fn(
      (_url: unknown, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new Error('Aborted')),
          );
        }),
    );
    const slow = createApiClient({
      baseUrl: BASE,
      getToken: () => Promise.resolve('t'),
      timeoutMs: 1000,
      fetchFn: fetchFn as unknown as typeof fetch,
    });

    const outcome = slow.get('/x').catch((e: unknown) => e);
    await jest.advanceTimersByTimeAsync(1000);

    expect(await outcome).toBeInstanceOf(ConnectionError);
  });

  it('sin URL configurada no intenta conectarse', async () => {
    const fake = createFakeFetch(() => jsonResponse(200, {}));
    const api = createApiClient({
      baseUrl: '',
      getToken: () => Promise.resolve('t'),
      fetchFn: fake.fetchFn,
    });

    await expect(api.get('/x')).rejects.toThrow('EXPO_PUBLIC_API_URL');
    expect(fake.fetchFn).not.toHaveBeenCalled();
  });

  it('una respuesta que no es JSON es un ServerError', async () => {
    const { api } = clientWith(
      () =>
        ({
          ok: true,
          status: 200,
          text: () => Promise.resolve('<html>'),
        }) as unknown as Response,
    );

    await expect(api.get('/x')).rejects.toBeInstanceOf(ServerError);
  });
});
