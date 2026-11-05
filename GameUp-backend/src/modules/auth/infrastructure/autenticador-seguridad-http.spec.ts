import type { ConfigService } from '@nestjs/config';
import {
  NoAutenticadoError,
  ServicioExternoNoDisponibleError,
} from '../../../common/errors/dominio.errors.js';
import type { EnvironmentVariables } from '../../../config/env.validation.js';
import { AutenticadorSeguridadHttp } from './autenticador-seguridad-http.js';

function config(url: string | undefined) {
  const valores: Record<string, unknown> = {
    SEGURIDAD_API_URL: url,
    SEGURIDAD_API_TIMEOUT_MS: 5000,
  };
  return { get: (k: string) => valores[k] } as unknown as ConfigService<
    EnvironmentVariables,
    true
  >;
}

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('AutenticadorSeguridadHttp', () => {
  let fetchFalso: ReturnType<typeof vi.fn>;
  const crear = (url: string | null = 'https://seguridad.test') => {
    const a = new AutenticadorSeguridadHttp(config(url ?? undefined));
    vi.spyOn(a['logger'], 'warn').mockImplementation(() => undefined);
    return a;
  };

  beforeEach(() => {
    fetchFalso = vi.fn(async () => json({ token: 'jwt-de-prueba' }));
    vi.stubGlobal('fetch', fetchFalso);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('envía correo_usuario y contraseña_usuario y devuelve el token', async () => {
    await expect(crear().iniciarSesion('a@ejemplo.com', 'clave')).resolves.toBe(
      'jwt-de-prueba',
    );
    const [url, init] = fetchFalso.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://seguridad.test/api/auth/login');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({
      correo_usuario: 'a@ejemplo.com',
      contraseña_usuario: 'clave',
    });
  });

  it.each([400, 401, 403, 404])(
    '%d → 401 «Correo o contraseña incorrectos» (no revela si el correo existe)',
    async (status) => {
      fetchFalso.mockResolvedValue(
        json({ message: 'Usuario no encontrado' }, status),
      );
      await expect(crear().iniciarSesion('a@ejemplo.com', 'x')).rejects.toThrow(
        new NoAutenticadoError('Correo o contraseña incorrectos.'),
      );
    },
  );

  it('500, red caída o respuesta sin token → 503', async () => {
    fetchFalso.mockResolvedValueOnce(json({}, 500));
    await expect(crear().iniciarSesion('a@ejemplo.com', 'x')).rejects.toThrow(
      ServicioExternoNoDisponibleError,
    );
    fetchFalso.mockRejectedValueOnce(new TypeError('fetch failed'));
    await expect(crear().iniciarSesion('a@ejemplo.com', 'x')).rejects.toThrow(
      /no responde/,
    );
    fetchFalso.mockResolvedValueOnce(json({ ok: true }));
    await expect(crear().iniciarSesion('a@ejemplo.com', 'x')).rejects.toThrow(
      /formato inesperado/,
    );
  });

  it('sin SEGURIDAD_API_URL → 503 sin llamar a nadie', async () => {
    await expect(
      crear(null).iniciarSesion('a@ejemplo.com', 'x'),
    ).rejects.toThrow(/SEGURIDAD_API_URL/);
    expect(fetchFalso).not.toHaveBeenCalled();
  });
});
