import type { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../../config/env.validation.js';
import {
  NoAutenticadoError,
  ServicioExternoNoDisponibleError,
} from '../../errors/dominio.errors.js';
import { RelojFijo } from '../../reloj/reloj.js';
import { leerExpiracionJwt } from './jwt.js';
import { VerificadorTokenPerfil } from './verificador-token-perfil.js';

const AHORA = new Date('2026-11-05T12:00:00Z');

/** JWT de prueba (firma falsa: el adaptador no la verifica). */
function jwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.firma`;
}

function config(valores: Partial<EnvironmentVariables>) {
  const todo = {
    SEGURIDAD_API_TIMEOUT_MS: 5000,
    AUTH_CACHE_TTL_SEG: 300,
    ...valores,
  };
  return {
    get: (clave: keyof EnvironmentVariables) =>
      todo[clave as keyof typeof todo],
  } as unknown as ConfigService<EnvironmentVariables, true>;
}

const PERFIL = { id_usuario: 7, nombre_rol: 'TALLERISTA', nombres: 'Ana' };

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('leerExpiracionJwt', () => {
  it('lee exp sin verificar la firma', () => {
    expect(leerExpiracionJwt(jwt({ exp: 1_800_000_000 }))).toEqual(
      new Date(1_800_000_000_000),
    );
  });

  it.each(['no-es-jwt', 'a.b.c', jwt({ sub: 1 }), jwt({ exp: 'mañana' })])(
    'devuelve null si no hay exp legible (%s)',
    (token) => {
      expect(leerExpiracionJwt(token)).toBeNull();
    },
  );
});

describe('VerificadorTokenPerfil', () => {
  let reloj: RelojFijo;
  let fetchFalso: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    reloj = new RelojFijo(AHORA);
    fetchFalso = vi.fn(async () => respuestaJson(PERFIL));
    vi.stubGlobal('fetch', fetchFalso);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const crear = (valores: Partial<EnvironmentVariables> = {}) => {
    const verificador = new VerificadorTokenPerfil(
      config({ SEGURIDAD_API_URL: 'https://seguridad.test/', ...valores }),
      reloj,
    );
    vi.spyOn(verificador['logger'], 'warn').mockImplementation(() => undefined);
    return verificador;
  };

  it('consulta /api/auth/perfil con el mismo token y mapea la identidad', async () => {
    const identidad = await crear().verificar('token-1');

    expect(identidad).toMatchObject({
      idUsuarioAuth: 7n,
      roles: ['TALLERISTA'],
      nombres: 'Ana',
    });
    expect(fetchFalso).toHaveBeenCalledWith(
      'https://seguridad.test/api/auth/perfil',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token-1' }),
      }),
    );
  });

  it('recuerda el token durante AUTH_CACHE_TTL_SEG', async () => {
    const verificador = crear();
    await verificador.verificar('token-1');
    reloj.avanzar(299_000);
    await verificador.verificar('token-1');
    expect(fetchFalso).toHaveBeenCalledTimes(1);

    reloj.avanzar(2_000); // pasan los 5 minutos
    await verificador.verificar('token-1');
    expect(fetchFalso).toHaveBeenCalledTimes(2);
  });

  it('la caché nunca dura más que el exp del token', async () => {
    const token = jwt({ exp: AHORA.getTime() / 1000 + 60 });
    const verificador = crear();
    await verificador.verificar(token);
    reloj.avanzar(30_000);
    await verificador.verificar(token);
    expect(fetchFalso).toHaveBeenCalledTimes(1);

    reloj.avanzar(31_000); // ya venció
    await expect(verificador.verificar(token)).rejects.toThrow(
      NoAutenticadoError,
    );
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });

  it('olvidar (logout) obliga a volver a preguntar a /perfil', async () => {
    const verificador = crear();
    await verificador.verificar('token-1');
    await verificador.verificar('token-2');
    verificador.olvidar('token-1');

    // Si la API de seguridad ya lo revocó, se nota de inmediato.
    fetchFalso.mockResolvedValueOnce(respuestaJson({}, 401));
    await expect(verificador.verificar('token-1')).rejects.toThrow(
      NoAutenticadoError,
    );
    // Los demás tokens siguen en caché.
    await verificador.verificar('token-2');
    expect(fetchFalso).toHaveBeenCalledTimes(3);
  });

  it('olvidar un token que no está en caché no falla', () => {
    expect(() => crear().olvidar('desconocido')).not.toThrow();
  });

  it('no guarda el token en claro en la caché', async () => {
    const verificador = crear();
    await verificador.verificar('token-secreto');
    const claves = [...verificador['cache'].keys()];
    expect(claves).toHaveLength(1);
    expect(claves[0]).toMatch(/^[0-9a-f]{64}$/);
    expect(claves[0]).not.toContain('token-secreto');
  });

  it('un token ya vencido responde 401 sin llamar a la API', async () => {
    const token = jwt({ exp: AHORA.getTime() / 1000 - 1 });
    await expect(crear().verificar(token)).rejects.toThrow(NoAutenticadoError);
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it.each([401, 403])(
    'si /perfil responde %d → NoAutenticadoError (401)',
    async (status) => {
      fetchFalso.mockResolvedValue(respuestaJson({ message: 'no' }, status));
      await expect(crear().verificar('t')).rejects.toThrow(NoAutenticadoError);
    },
  );

  it('no guarda en caché un token rechazado', async () => {
    fetchFalso.mockResolvedValueOnce(respuestaJson({}, 401));
    const verificador = crear();
    await expect(verificador.verificar('t')).rejects.toThrow(
      NoAutenticadoError,
    );
    await verificador.verificar('t');
    expect(fetchFalso).toHaveBeenCalledTimes(2);
  });

  it('si /perfil responde 500 → ServicioExternoNoDisponibleError (503)', async () => {
    fetchFalso.mockResolvedValue(respuestaJson({}, 500));
    await expect(crear().verificar('t')).rejects.toThrow(
      ServicioExternoNoDisponibleError,
    );
  });

  it('si la API no responde (red o timeout) → 503', async () => {
    fetchFalso.mockRejectedValue(new TypeError('fetch failed'));
    await expect(crear().verificar('t')).rejects.toThrow(
      ServicioExternoNoDisponibleError,
    );
  });

  it('si el perfil no tiene la forma esperada → 503', async () => {
    fetchFalso.mockResolvedValue(respuestaJson({ hola: 'mundo' }));
    await expect(crear().verificar('t')).rejects.toThrow(/formato inesperado/);
  });

  it('sin SEGURIDAD_API_URL responde 503 con un mensaje claro', async () => {
    const verificador = new VerificadorTokenPerfil(config({}), reloj);
    await expect(verificador.verificar('t')).rejects.toThrow(
      /SEGURIDAD_API_URL/,
    );
    expect(fetchFalso).not.toHaveBeenCalled();
  });
});
