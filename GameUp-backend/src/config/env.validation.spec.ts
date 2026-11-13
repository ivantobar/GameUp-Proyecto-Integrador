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

  it('CONSENTIMIENTO_SIMULADO: false por defecto y lectura estricta', () => {
    expect(validateEnv({ DATABASE_URL: DB }).CONSENTIMIENTO_SIMULADO).toBe(
      false,
    );
    expect(
      validateEnv({ DATABASE_URL: DB, CONSENTIMIENTO_SIMULADO: 'false' })
        .CONSENTIMIENTO_SIMULADO,
    ).toBe(false);
    expect(
      validateEnv({ DATABASE_URL: DB, CONSENTIMIENTO_SIMULADO: 'true' })
        .CONSENTIMIENTO_SIMULADO,
    ).toBe(true);
    expect(() =>
      validateEnv({ DATABASE_URL: DB, CONSENTIMIENTO_SIMULADO: 'si' }),
    ).toThrow(/true o false/);
  });

  it('CONSENTIMIENTO_SIMULADO está prohibido en producción', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: DB,
        NODE_ENV: 'production',
        CONSENTIMIENTO_SIMULADO: 'true',
      }),
    ).toThrow(/no se puede activar en producción/);
  });

  it('LIMPIEZA_GRABACIONES_MIN: 30 por defecto, 0 la desactiva', () => {
    expect(validateEnv({ DATABASE_URL: DB }).LIMPIEZA_GRABACIONES_MIN).toBe(30);
    expect(
      validateEnv({ DATABASE_URL: DB, LIMPIEZA_GRABACIONES_MIN: '0' })
        .LIMPIEZA_GRABACIONES_MIN,
    ).toBe(0);
    expect(() =>
      validateEnv({ DATABASE_URL: DB, LIMPIEZA_GRABACIONES_MIN: '-1' }),
    ).toThrow(/inválidas/);
  });

  describe('ALTA_AUTOMATICA_ROLES', () => {
    it('por defecto, los cuatro roles', () => {
      expect(validateEnv({ DATABASE_URL: DB }).ALTA_AUTOMATICA_ROLES).toBe(
        'ESTUDIANTE,ACUDIENTE,TALLERISTA,DIRECTORA',
      );
    });

    it.each([
      'ESTUDIANTE',
      'ESTUDIANTE,ACUDIENTE',
      ' TALLERISTA , DIRECTORA ',
      'ACUDIENTE,ACUDIENTE',
      'ESTUDIANTE,ACUDIENTE,TALLERISTA,DIRECTORA',
    ])('acepta %j', (valor) => {
      expect(
        validateEnv({ DATABASE_URL: DB, ALTA_AUTOMATICA_ROLES: valor })
          .ALTA_AUTOMATICA_ROLES,
      ).toBe(valor);
    });

    it.each(['', '   '])('vacía (%j) es válida: apaga el alta', (valor) => {
      expect(() =>
        validateEnv({ DATABASE_URL: DB, ALTA_AUTOMATICA_ROLES: valor }),
      ).not.toThrow();
    });

    it.each([
      ['ADMIN', /no reconoce: ADMIN/],
      ['estudiante', /no reconoce: estudiante/],
      ['ESTUDIANTE,DONANTE', /no reconoce: DONANTE/],
      ['ESTUDIANTE;ACUDIENTE', /no reconoce: ESTUDIANTE;ACUDIENTE/],
    ])('rechaza %j', (valor, mensaje) => {
      expect(() =>
        validateEnv({ DATABASE_URL: DB, ALTA_AUTOMATICA_ROLES: valor }),
      ).toThrow(mensaje);
    });
  });

  it('límite de peticiones: valores por defecto', () => {
    const env = validateEnv({ DATABASE_URL: DB });
    expect(env.THROTTLE_GLOBAL_LIMITE).toBe(600);
    expect(env.THROTTLE_GLOBAL_VENTANA_SEG).toBe(60);
    expect(env.THROTTLE_LOGIN_LIMITE).toBe(10);
    expect(env.THROTTLE_LOGIN_VENTANA_SEG).toBe(60);
    expect(env.THROTTLE_LOGIN_IP_LIMITE).toBe(100);
    expect(env.THROTTLE_LOGIN_IP_VENTANA_SEG).toBe(60);
  });

  it('límite de peticiones: se ajusta por variable y rechaza 0 o texto', () => {
    expect(
      validateEnv({ DATABASE_URL: DB, THROTTLE_LOGIN_LIMITE: '5' })
        .THROTTLE_LOGIN_LIMITE,
    ).toBe(5);
    expect(() =>
      validateEnv({ DATABASE_URL: DB, THROTTLE_GLOBAL_LIMITE: '0' }),
    ).toThrow(/inválidas/);
    expect(() =>
      validateEnv({ DATABASE_URL: DB, THROTTLE_LOGIN_VENTANA_SEG: 'abc' }),
    ).toThrow(/inválidas/);
  });

  it('Supabase es opcional', () => {
    const env = validateEnv({ DATABASE_URL: DB, NODE_ENV: 'production' });
    expect(env.SUPABASE_URL).toBeUndefined();
  });
});
