import { checkApiUrl, normalizeApiUrl, parseDataSource } from '../env';

describe('parseDataSource', () => {
  describe('en desarrollo', () => {
    it.each([
      [undefined, 'mock'],
      ['', 'mock'],
      ['mock', 'mock'],
      ['otra-cosa', 'mock'],
      ['api', 'api'],
      [' API ', 'api'],
    ])('%p → %s', (value, expected) => {
      expect(parseDataSource(value, true)).toBe(expected);
    });
  });

  describe('fuera de desarrollo', () => {
    it.each([undefined, '', 'mock', ' MOCK ', 'otra-cosa', 'api'])(
      '%p → siempre api',
      (value) => {
        expect(parseDataSource(value, false)).toBe('api');
      },
    );
  });
});

describe('checkApiUrl', () => {
  describe('en desarrollo', () => {
    it.each([
      ['http://192.168.1.20:3000/api/v1', null],
      ['https://gameup-backend.onrender.com/api/v1', null],
      ['  HTTP://192.168.1.20:3000/api/v1  ', null],
      [undefined, 'missing'],
      ['', 'missing'],
      ['   ', 'missing'],
      ['192.168.1.20:3000/api/v1', 'insecure'],
      ['ftp://ejemplo.test', 'insecure'],
    ])('%p → %p', (value, expected) => {
      expect(checkApiUrl(value, true)).toBe(expected);
    });
  });

  describe('fuera de desarrollo', () => {
    it.each([
      ['https://gameup-backend.onrender.com/api/v1', null],
      ['HTTPS://gameup-backend.onrender.com/api/v1', null],
      ['  https://gameup-backend.onrender.com/api/v1  ', null],
      [undefined, 'missing'],
      ['', 'missing'],
      ['   ', 'missing'],
      ['http://192.168.1.20:3000/api/v1', 'insecure'],
      ['HTTP://gameup-backend.onrender.com/api/v1', 'insecure'],
      ['gameup-backend.onrender.com/api/v1', 'insecure'],
    ])('%p → %p', (value, expected) => {
      expect(checkApiUrl(value, false)).toBe(expected);
    });
  });
});

describe('normalizeApiUrl', () => {
  it('quita espacios y las "/" del final', () => {
    expect(normalizeApiUrl('  https://api.test/api/v1//  ')).toBe(
      'https://api.test/api/v1',
    );
    expect(normalizeApiUrl(undefined)).toBe('');
  });
});

describe('env (lectura de las variables)', () => {
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

  /** Carga `env` de nuevo con estas variables. */
  function loadEnv(isDev: boolean, url: string | undefined, source: string) {
    (globalThis as unknown as { __DEV__: boolean }).__DEV__ = isDev;
    if (url === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = url;
    process.env.EXPO_PUBLIC_DATA_SOURCE = source;
    let loaded: typeof import('../env').env | undefined;
    jest.isolateModules(() => {
      loaded = jest.requireActual<typeof import('../env')>('../env').env;
    });
    return loaded!;
  }

  it('fuera de desarrollo, con mock y https, usa la API y no bloquea', () => {
    const env = loadEnv(
      false,
      'https://gameup-backend.onrender.com/api/v1',
      'mock',
    );
    expect(env.dataSource).toBe('api');
    expect(env.configProblem).toBeNull();
  });

  it('fuera de desarrollo, sin URL, bloquea la app', () => {
    const env = loadEnv(false, undefined, 'api');
    expect(env.configProblem).toBe('missing');
  });

  it('fuera de desarrollo, con http://, bloquea la app', () => {
    const env = loadEnv(false, 'http://192.168.1.20:3000/api/v1', 'api');
    expect(env.configProblem).toBe('insecure');
  });

  it('en desarrollo, sin URL, sigue funcionando con mock', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const env = loadEnv(true, undefined, 'mock');
    expect(env.dataSource).toBe('mock');
    expect(env.configProblem).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

/** Devuelve la variable a su valor (asignar `undefined` dejaría el texto "undefined"). */
function restore(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
