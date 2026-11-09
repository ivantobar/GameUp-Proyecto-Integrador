import type { ConfigService } from '@nestjs/config';
import { ServicioExternoNoDisponibleError } from '../../../common/errors/dominio.errors.js';
import type { EnvironmentVariables } from '../../../config/env.validation.js';
import { DirectorioCentralHttp } from './directorio-central-http.js';

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Forma real de GET /api/usuarios/{id} (2026-11-09), con datos ficticios. */
const persona = (extra: Record<string, unknown> = {}) => ({
  id_usuario: 47,
  nombres: 'Martín',
  apellidos: 'Cruz',
  tipo_documento: null,
  numero_identificacion: '0000000000',
  telefono: null,
  direccion: null,
  fecha_nacimiento: null,
  correo_usuario: 'martin@ejemplo.com',
  acepta_terminos_condiciones: true,
  creado_en: '2026-11-05T17:16:17.576Z',
  roles: [{ id_rol: 1, nombre_rol: 'ESTUDIANTE' }],
  ...extra,
});

function config(
  url: string | undefined,
): ConfigService<EnvironmentVariables, true> {
  const valores: Record<string, unknown> = {
    SEGURIDAD_API_URL: url,
    SEGURIDAD_API_TIMEOUT_MS: 5000,
  };
  return {
    get: (clave: string) => valores[clave],
  } as unknown as ConfigService<EnvironmentVariables, true>;
}

describe('DirectorioCentralHttp (GET /api/usuarios/{id})', () => {
  let fetchFalso: ReturnType<typeof vi.fn>;
  const crear = (url: string | undefined = 'https://seguridad.test/') => {
    const d = new DirectorioCentralHttp(config(url));
    vi.spyOn(d['logger'], 'warn').mockImplementation(() => undefined);
    return d;
  };

  beforeEach(() => {
    fetchFalso = vi.fn(async () => json(persona()));
    vi.stubGlobal('fetch', fetchFalso);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('consulta /api/usuarios/{id} con el token de quien llama', async () => {
    await crear().buscar(47n, 'jwt-admin');
    const [url, init] = fetchFalso.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://seguridad.test/api/usuarios/47');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer jwt-admin' });
  });

  it('solo toma id, nombres, apellidos, correo y roles', async () => {
    const identidad = await crear().buscar(47n, 't');
    expect(identidad).toEqual({
      idUsuarioAuth: 47n,
      nombres: 'Martín',
      apellidos: 'Cruz',
      correo: 'martin@ejemplo.com',
      roles: ['ESTUDIANTE'],
    });
  });

  it('404 → null', async () => {
    fetchFalso.mockResolvedValue(json({ error: 'Recurso no encontrado' }, 404));
    await expect(crear().buscar(999999n, 't')).resolves.toBeNull();
  });

  it.each([
    ['401', () => json({ error: 'Se requiere un token Bearer' }, 401)],
    ['500', () => json({ error: 'x' }, 500)],
    ['formato inesperado', () => json({ algo: 1 })],
    ['otra persona', () => json(persona({ id_usuario: 48 }))],
  ])('%s → servicio no disponible (503)', async (_n, resp) => {
    fetchFalso.mockResolvedValue(resp());
    await expect(crear().buscar(47n, 't')).rejects.toBeInstanceOf(
      ServicioExternoNoDisponibleError,
    );
  });

  it('sin respuesta → servicio no disponible', async () => {
    fetchFalso.mockRejectedValue(new Error('timeout'));
    await expect(crear().buscar(47n, 't')).rejects.toBeInstanceOf(
      ServicioExternoNoDisponibleError,
    );
  });

  it('sin SEGURIDAD_API_URL → servicio no disponible, sin llamar', async () => {
    const sinUrl = new DirectorioCentralHttp(config(undefined));
    await expect(sinUrl.buscar(47n, 't')).rejects.toBeInstanceOf(
      ServicioExternoNoDisponibleError,
    );
    expect(fetchFalso).not.toHaveBeenCalled();
  });
});
