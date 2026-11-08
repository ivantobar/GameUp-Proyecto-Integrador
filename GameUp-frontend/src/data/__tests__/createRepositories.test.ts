import { createRepositories } from '../createRepositories';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// La tabla de `parseDataSource` y `checkApiUrl` vive en
// `src/config/__tests__/env.test.ts`.

describe('punto de composición', () => {
  it('con mock, los datos simulados responden sin backend', async () => {
    const repos = createRepositories({
      dataSource: 'mock',
      onSessionExpired: jest.fn(),
    });
    const pending = repos.practice.getVowelPractice('x');
    await jest.runAllTimersAsync();
    await expect(pending).resolves.toHaveLength(5);
  });

  it('con api, también el acudiente pide sus datos al backend (sin datos inventados)', async () => {
    const onSessionExpired = jest.fn();
    const repos = createRepositories({ dataSource: 'api', onSessionExpired });

    // Sin sesión: no inventa estudiantes, vuelve a «Iniciar sesión».
    await expect(repos.guardians.listStudents('x')).rejects.toThrow();
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('con api y sin sesión, pedir datos vuelve a «Iniciar sesión»', async () => {
    const onSessionExpired = jest.fn();
    const repos = createRepositories({ dataSource: 'api', onSessionExpired });

    await expect(repos.students.getCurrentStudent()).rejects.toThrow();
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('fuera de desarrollo, aunque se pida mock, usa la API', async () => {
    const onSessionExpired = jest.fn();
    const repos = createRepositories({
      dataSource: 'mock',
      isDev: false,
      onSessionExpired,
    });

    // Un simulado respondería con el estudiante ficticio; la API, sin
    // sesión, lo rechaza y vuelve a «Iniciar sesión».
    await expect(repos.students.getCurrentStudent()).rejects.toThrow();
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });
});

describe('fuera de desarrollo con EXPO_PUBLIC_DATA_SOURCE=mock', () => {
  const original = {
    dev: __DEV__,
    url: process.env.EXPO_PUBLIC_API_URL,
    source: process.env.EXPO_PUBLIC_DATA_SOURCE,
  };

  afterEach(() => {
    (globalThis as unknown as { __DEV__: boolean }).__DEV__ = original.dev;
    restore('EXPO_PUBLIC_API_URL', original.url);
    restore('EXPO_PUBLIC_DATA_SOURCE', original.source);
  });

  it('createRepositories() nunca devuelve los repositorios simulados', async () => {
    (globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;
    process.env.EXPO_PUBLIC_DATA_SOURCE = 'mock';
    process.env.EXPO_PUBLIC_API_URL = 'https://api.gameup.test/api/v1';

    const mockFactory = jest.fn();

    let create: typeof createRepositories | undefined;
    jest.isolateModules(() => {
      jest.doMock('../mock/createMockRepositories', () => ({
        createMockRepositories: mockFactory,
      }));
      create = jest.requireActual<typeof import('../createRepositories')>(
        '../createRepositories',
      ).createRepositories;
    });

    // Sin opciones: todo sale de las variables de entorno y de `__DEV__`.
    const onSessionExpired = jest.fn();
    const repos = create!({ onSessionExpired });

    expect(mockFactory).not.toHaveBeenCalled();
    await expect(repos.students.getCurrentStudent()).rejects.toThrow();
    // Sin sesión, la API ni siquiera llama a la red: vuelve a «Iniciar sesión».
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });
});

/** Devuelve la variable a su valor (asignar `undefined` dejaría el texto "undefined"). */
function restore(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
