import { validateEnv } from './env.validation.js';

const DB = 'postgresql://usuario:clave@localhost:5432/gameup';

describe('validateEnv', () => {
  it('aplica valores por defecto', () => {
    const env = validateEnv({ DATABASE_URL: DB });
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
  });

  it('convierte PORT de texto a número', () => {
    expect(validateEnv({ DATABASE_URL: DB, PORT: '4000' }).PORT).toBe(4000);
  });

  it('rechaza un PORT inválido', () => {
    expect(() => validateEnv({ DATABASE_URL: DB, PORT: 'abc' })).toThrow(
      /inválidas/,
    );
  });

  it('exige DATABASE_URL', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL es obligatoria/);
  });

  it('rechaza una DATABASE_URL que no es de PostgreSQL', () => {
    expect(() =>
      validateEnv({ DATABASE_URL: 'mysql://x@localhost/db' }),
    ).toThrow(/debe empezar por postgresql/);
  });

  it('API de seguridad: URL opcional y valores por defecto de timeout y caché', () => {
    const env = validateEnv({ DATABASE_URL: DB });
    expect(env.SEGURIDAD_API_URL).toBeUndefined();
    expect(env.SEGURIDAD_API_TIMEOUT_MS).toBe(5000);
    expect(env.AUTH_CACHE_TTL_SEG).toBe(300);
  });

  it('la caché de tokens no puede pasar de 5 minutos', () => {
    expect(() =>
      validateEnv({ DATABASE_URL: DB, AUTH_CACHE_TTL_SEG: '301' }),
    ).toThrow(/inválidas/);
  });

  it('rechaza una SEGURIDAD_API_URL que no es URL', () => {
    expect(() =>
      validateEnv({ DATABASE_URL: DB, SEGURIDAD_API_URL: 'no es url' }),
    ).toThrow(/inválidas/);
  });

  it('Supabase es opcional', () => {
    const env = validateEnv({ DATABASE_URL: DB, NODE_ENV: 'production' });
    expect(env.SUPABASE_URL).toBeUndefined();
  });
});
