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

  it('503 o sin red: no son credenciales inválidas', async () => {
    const down = setup(() => errorResponse(503, 'API de seguridad caída'));
    await expect(
      down.repos.auth.signIn({ email: 'a@b.co', password: 'x' }),
    ).rejects.toBeInstanceOf(ServerError);

    const offline = setup(() => {
      throw new TypeError('Network request failed');
    });
    await expect(
      offline.repos.auth.signIn({ email: 'a@b.co', password: 'x' }),
    ).rejects.toBeInstanceOf(ConnectionError);
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
