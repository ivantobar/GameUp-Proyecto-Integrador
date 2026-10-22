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

  it('Supabase es opcional', () => {
    const env = validateEnv({ DATABASE_URL: DB, NODE_ENV: 'production' });
    expect(env.SUPABASE_URL).toBeUndefined();
  });
});
