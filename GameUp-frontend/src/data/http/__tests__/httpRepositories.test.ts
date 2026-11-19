import { createApiClient } from '@/services/api';
import { ConnectionError, ServerError } from '@/services/apiErrors';
import {
  createFakeFetch,
  errorResponse,
  jsonResponse,
  type FakeHandler,
} from '@/test-utils/fakeFetch';
import {
  AccountNotAllowedError,
  InvalidCredentialsError,
  SignInUnavailableError,
  TooManyAttemptsError,
} from '../../authErrors';
import { createHttpRepositories } from '../createHttpRepositories';
import { createMemoryTokenStore } from '../tokenStore';

const BASE = 'http://api.prueba/api/v1';

function setup(handler: FakeHandler, initialToken: string | null = null) {
  const fake = createFakeFetch(handler);
  const tokens = createMemoryTokenStore(initialToken);
  const api = createApiClient({
    baseUrl: BASE,
    getToken: tokens.get,
    fetchFn: fake.fetchFn,
  });
  return { repos: createHttpRepositories(api, tokens), tokens, ...fake };
}

const loginOk = {
  token: 'jwt-ficticio',
  expiraEn: null,
  usuario: { userId: '12', role: 'teacher', displayName: 'Ana Gómez' },
};

describe('AuthRepository (HTTP)', () => {
  it('llama a POST /auth/login con correo y contraseña, sin token', async () => {
    const { repos, requests } = setup(() => jsonResponse(200, loginOk));

    await repos.auth.signIn({ email: 'ana@prueba.test', password: 'clave' });

    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      url: `${BASE}/auth/login`,
      method: 'POST',
      body: { correo: 'ana@prueba.test', contrasena: 'clave' },
    });
    expect(requests[0]?.headers.Authorization).toBeUndefined();
  });

  it('devuelve la sesión con el rol y guarda el token aparte', async () => {
    const { repos, tokens } = setup(() => jsonResponse(200, loginOk));

    const session = await repos.auth.signIn({ email: 'a@b.co', password: 'x' });

    expect(session).toEqual({
      userId: '12',
      role: 'teacher',
      displayName: 'Ana Gómez',
    });
    expect(JSON.stringify(session)).not.toContain('jwt-ficticio');
    await expect(tokens.get()).resolves.toBe('jwt-ficticio');
  });

  it('401: credenciales inválidas, como la versión simulada', async () => {
    const { repos, tokens } = setup(
      () => errorResponse(401, 'Correo o contraseña incorrectos'),
      'token-anterior',
    );

    await expect(
      repos.auth.signIn({ email: 'a@b.co', password: 'mala' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    // La sesión anterior no sigue viva después de un intento fallido.
    await expect(tokens.get()).resolves.toBeNull();
  });

  it('403: la cuenta no tiene acceso a GameUP', async () => {
    const { repos } = setup(() => errorResponse(403, 'Sin cuenta en GameUP'));

    await expect(
      repos.auth.signIn({ email: 'a@b.co', password: 'x' }),
    ).rejects.toBeInstanceOf(AccountNotAllowedError);
  });

  it('403 con motivo del backend: lo lleva para mostrarlo', async () => {
    const motivo =
      'Aún no te encontramos en ASISCO UP. Pide a la fundación que revise tu registro.';
    const { repos } = setup(() => errorResponse(403, motivo));

    const error: unknown = await repos.auth
      .signIn({ email: 'a@b.co', password: 'x' })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AccountNotAllowedError);
    expect((error as AccountNotAllowedError).reason).toBe(motivo);
  });

  it('403 sin motivo (o técnico): no lleva motivo y la pantalla usa el general', async () => {
    const sinMensaje = setup(() => jsonResponse(403, { statusCode: 403 }));
    const e1: unknown = await sinMensaje.repos.auth
      .signIn({ email: 'a@b.co', password: 'x' })
      .catch((e: unknown) => e);
    expect(e1).toBeInstanceOf(AccountNotAllowedError);
    expect((e1 as AccountNotAllowedError).reason).toBeNull();

    const tecnico = setup(() =>
      errorResponse(403, 'PrismaClientKnownRequestError: usuario 123'),
    );
    const e2: unknown = await tecnico.repos.auth
      .signIn({ email: 'a@b.co', password: 'x' })
      .catch((e: unknown) => e);
    expect((e2 as AccountNotAllowedError).reason).toBeNull();
  });

  it('429 (demasiados intentos): TooManyAttemptsError, no un error de conexión', async () => {
    const frenado = setup(() =>
      errorResponse(
        429,
        'Demasiados intentos. Espera un momento y vuelve a intentarlo.',
      ),
    );
    await expect(
      frenado.repos.auth.signIn({ email: 'a@b.co', password: 'x' }),
    ).rejects.toBeInstanceOf(TooManyAttemptsError);
  });

  it('503 o sin red: no son credenciales inválidas', async () => {
    // 503: respondió el backend, pero no la API de seguridad.
    const down = setup(() => errorResponse(503, 'API de seguridad caída'));
    await expect(
      down.repos.auth.signIn({ email: 'a@b.co', password: 'x' }),
    ).rejects.toBeInstanceOf(SignInUnavailableError);

    const broken = setup(() => errorResponse(500, 'Error interno'));
    await expect(
      broken.repos.auth.signIn({ email: 'a@b.co', password: 'x' }),
    ).rejects.toBeInstanceOf(ServerError);

    const offline = setup(() => {
      throw new TypeError('Network request failed');
    });
    await expect(
      offline.repos.auth.signIn({ email: 'a@b.co', password: 'x' }),
    ).rejects.toBeInstanceOf(ConnectionError);
    // Cada caso se intentó dos veces, salvo el 500 (no es despertar).
    expect(down.requests).toHaveLength(2);
    expect(broken.requests).toHaveLength(1);
    expect(offline.requests).toHaveLength(2);
  });

  it.each([
    ['503 (la API de seguridad despertando)', () => errorResponse(503, 'x')],
    [
      'sin respuesta',
      () => {
        throw new TypeError('Network request failed');
      },
    ],
  ])(
    'Render despertando: con %s reintenta una vez y entra',
    async (_name, firstFailure) => {
      let calls = 0;
      const { repos, requests } = setup(() => {
        calls += 1;
        return calls === 1 ? firstFailure() : jsonResponse(200, loginOk);
      });

      const session = await repos.auth.signIn({
        email: 'a@b.co',
        password: 'x',
      });

      expect(session.role).toBe('teacher');
      expect(requests).toHaveLength(2);
    },
  );

  it('reintenta solo una vez: si vuelve a fallar, avisa', async () => {
    const { repos, requests } = setup(() => errorResponse(503, 'x'));

    await expect(
      repos.auth.signIn({ email: 'a@b.co', password: 'x' }),
    ).rejects.toBeInstanceOf(SignInUnavailableError);
    expect(requests).toHaveLength(2);
  });

  it('una contraseña equivocada no se reintenta', async () => {
    const { repos, requests } = setup(() => errorResponse(401, 'No'));

    await expect(
      repos.auth.signIn({ email: 'a@b.co', password: 'x' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(requests).toHaveLength(1);
  });

  it('espera hasta un minuto la respuesta del inicio de sesión', async () => {
    // Responde a los 50 s (Render despertando): con 15 s se habría rendido.
    const fetchFn = jest.fn(
      (_url: unknown, init?: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          const id = setTimeout(
            () => resolve(jsonResponse(200, loginOk)),
            50_000,
          );
          init?.signal?.addEventListener('abort', () => {
            clearTimeout(id);
            reject(new Error('Aborted'));
          });
        }),
    );
    const tokens = createMemoryTokenStore();
    const api = createApiClient({
      baseUrl: BASE,
      getToken: tokens.get,
      fetchFn: fetchFn as unknown as typeof fetch,
    });
    const repos = createHttpRepositories(api, tokens);

    const pending = repos.auth.signIn({ email: 'a@b.co', password: 'x' });
    await jest.advanceTimersByTimeAsync(50_000);

    await expect(pending).resolves.toMatchObject({ role: 'teacher' });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('un rol desconocido no inicia sesión ni guarda el token', async () => {
    const { repos, tokens } = setup(() =>
      jsonResponse(200, {
        ...loginOk,
        usuario: { ...loginOk.usuario, role: 'DONANTE' },
      }),
    );

    await expect(
      repos.auth.signIn({ email: 'a@b.co', password: 'x' }),
    ).rejects.toBeInstanceOf(ServerError);
    await expect(tokens.get()).resolves.toBeNull();
  });
});

describe('despertar el backend al abrir «Iniciar sesión»', () => {
  it('pide GET /health sin token', async () => {
    const { repos, requests } = setup(() => jsonResponse(200, {}));

    await repos.auth.warmUp();

    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      url: `${BASE}/health`,
      method: 'GET',
    });
    expect(requests[0]?.headers.Authorization).toBeUndefined();
  });

  it('si no responde, no pasa nada', async () => {
    const offline = setup(() => {
      throw new TypeError('Network request failed');
    });
    await expect(offline.repos.auth.warmUp()).resolves.toBeUndefined();

    const down = setup(() => errorResponse(503, 'x'));
    await expect(down.repos.auth.warmUp()).resolves.toBeUndefined();
  });
});

describe('StudentRepository y StaffRepository (HTTP)', () => {
  it('el estudiante sale de GET /estudiantes/me con el token', async () => {
    const { repos, requests } = setup(
      () =>
        jsonResponse(200, {
          id: '31',
          displayName: 'Martín',
          personajeAvatar: null,
          nivel: { id: '1', nombre: 'BAJO' },
        }),
      'jwt',
    );

    await expect(repos.students.getCurrentStudent()).resolves.toEqual({
      id: '31',
      displayName: 'Martín',
    });
    expect(requests[0]).toMatchObject({
      url: `${BASE}/estudiantes/me`,
      method: 'GET',
      headers: { Authorization: 'Bearer jwt' },
    });
  });

  it.each(['getCurrentTeacher', 'getCurrentGuardian'] as const)(
    '%s sale de GET /auth/me',
    async (method) => {
      const { repos, requests } = setup(
        () =>
          jsonResponse(200, {
            userId: '5',
            role: 'teacher',
            displayName: 'Ana Gómez',
          }),
        'jwt',
      );

      await expect(repos.staff[method]()).resolves.toEqual({
        id: '5',
        displayName: 'Ana Gómez',
      });
      expect(requests[0]?.url).toBe(`${BASE}/auth/me`);
    },
  );
});

describe('cerrar sesión', () => {
  it('avisa al backend y olvida el token', async () => {
    const { repos, tokens, requests } = setup(() => jsonResponse(204), 'jwt');

    await repos.auth.signOut();

    expect(requests[0]).toMatchObject({
      url: `${BASE}/auth/logout`,
      method: 'POST',
      headers: { Authorization: 'Bearer jwt' },
    });
    await expect(tokens.get()).resolves.toBeNull();
  });

  it('sin red, la sesión se cierra igual en el teléfono', async () => {
    const { repos, tokens } = setup(() => {
      throw new TypeError('Network request failed');
    }, 'jwt');

    await expect(repos.auth.signOut()).resolves.toBeUndefined();
    await expect(tokens.get()).resolves.toBeNull();
  });

  it('sin sesión no llama al servidor', async () => {
    const { repos, fetchFn } = setup(() => jsonResponse(204));

    await repos.auth.signOut();

    expect(fetchFn).not.toHaveBeenCalled();
  });
});
