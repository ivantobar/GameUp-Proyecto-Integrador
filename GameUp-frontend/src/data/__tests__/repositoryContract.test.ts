import { createApiClient } from '@/services/api';
import { createFakeBackend, FAKE_API_URL } from '@/test-utils/fakeBackend';
import { InvalidCredentialsError } from '../authErrors';
import { createHttpRepositories } from '../http/createHttpRepositories';
import { createMemoryTokenStore } from '../http/tokenStore';
import { createMockRepositories } from '../mock/createMockRepositories';
import { MOCK_PASSWORD } from '../mock/fixtures';
import type { Repositories } from '../repositories';

/**
 * Sustitución de Liskov: la versión simulada y la HTTP cumplen el mismo
 * contrato. Las mismas pruebas corren contra las dos; si una se comporta
 * distinto (otro tipo, otro error), falla aquí y no en una pantalla.
 */

/** Espera una promesa avanzando el reloj simulado (los mocks usan setTimeout). */
async function settle<T>(promise: Promise<T>): Promise<T> {
  const outcome = promise.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  );
  await jest.runAllTimersAsync();
  const result = await outcome;
  if (result.ok) return result.value;
  throw result.error;
}

const implementations: [string, () => Repositories][] = [
  ['simulada', () => createMockRepositories({ delayMs: 0 })],
  [
    'HTTP',
    () => {
      const tokens = createMemoryTokenStore();
      const api = createApiClient({
        baseUrl: FAKE_API_URL,
        getToken: tokens.get,
        fetchFn: createFakeBackend().fetchFn,
      });
      return createHttpRepositories(api, tokens);
    },
  ],
];

describe.each(implementations)('contrato de la versión %s', (_name, create) => {
  let repos: Repositories;
  const signInAs = (email: string) =>
    settle(repos.auth.signIn({ email, password: MOCK_PASSWORD }));

  beforeEach(() => {
    repos = create();
  });

  it.each([
    ['estudiante@gameup.test', 'student'],
    ['docente@gameup.test', 'teacher'],
    ['acudiente@gameup.test', 'guardian'],
    ['directora@gameup.test', 'director'],
  ])('%s entra con el rol %s', async (email, role) => {
    const session = await signInAs(email);

    expect(session.role).toBe(role);
    expect(typeof session.userId).toBe('string');
    expect(typeof session.displayName).toBe('string');
    expect(Object.keys(session).sort()).toEqual([
      'displayName',
      'role',
      'userId',
    ]);
  });

  it('una contraseña equivocada rechaza con InvalidCredentialsError', async () => {
    await expect(
      settle(
        repos.auth.signIn({ email: 'docente@gameup.test', password: 'mala' }),
      ),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('una cuenta que no existe rechaza con InvalidCredentialsError', async () => {
    await expect(
      settle(
        repos.auth.signIn({
          email: 'nadie@gameup.test',
          password: MOCK_PASSWORD,
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('el estudiante con sesión es un StudentProfile', async () => {
    const session = await signInAs('estudiante@gameup.test');

    const student = await settle(repos.students.getCurrentStudent());

    expect(student).toEqual({
      id: session.userId,
      displayName: expect.any(String),
    });
  });

  it('la docente y el acudiente con sesión son StaffProfile', async () => {
    const teacher = await signInAs('docente@gameup.test');
    expect(await settle(repos.staff.getCurrentTeacher())).toEqual({
      id: teacher.userId,
      displayName: teacher.displayName,
    });

    const guardian = await signInAs('acudiente@gameup.test');
    expect(await settle(repos.staff.getCurrentGuardian())).toEqual({
      id: guardian.userId,
      displayName: guardian.displayName,
    });
  });
});
