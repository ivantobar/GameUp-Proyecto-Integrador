import { ServicioExternoNoDisponibleError } from '../../../common/errors/dominio.errors.js';
import { ConsultaEstudianteAsiscoUpHttp } from './estudiante-asiscoup-http.js';

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Forma real de ASISCO UP (2026-11-08), con datos ficticios. */
const ficha = (extra: Record<string, unknown> = {}) => ({
  idEstudiante: 12,
  documentoIdentidad: '0000000000',
  idUsuarioAuth: '13',
  id_usuario: 13,
  nombre: 'Estudiante De Prueba',
  diagnostico: { nombre: 'Diagnóstico ficticio' },
  vinculos: [],
  ...extra,
});

describe('ConsultaEstudianteAsiscoUpHttp', () => {
  let fetchFalso: ReturnType<typeof vi.fn>;
  let warn: ReturnType<typeof vi.spyOn>;
  const crear = (timeoutMs = 5000) => {
    const c = new ConsultaEstudianteAsiscoUpHttp(
      'https://asiscoup.test/',
      timeoutMs,
    );
    warn = vi.spyOn(c['logger'], 'warn').mockImplementation(() => undefined);
    return c;
  };

  beforeEach(() => {
    fetchFalso = vi.fn(async () => json(ficha()));
    vi.stubGlobal('fetch', fetchFalso);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('llama a la ruta exacta por id_usuario con el token de la persona', async () => {
    await crear().porIdUsuarioAuth(13n, 'tok');
    const [url, init] = fetchFalso.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://asiscoup.test/api/estudiantes/por-usuario/13');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer tok',
    );
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('respuesta válida → solo el idEstudiante', async () => {
    await expect(crear().porIdUsuarioAuth(13n, 'tok')).resolves.toBe(12n);
  });

  it('acepta el id_usuario numérico si falta idUsuarioAuth', async () => {
    fetchFalso.mockResolvedValue(json(ficha({ idUsuarioAuth: undefined })));
    await expect(crear().porIdUsuarioAuth(13n, 'tok')).resolves.toBe(12n);
  });

  it.each([
    ['idUsuarioAuth distinto', ficha({ idUsuarioAuth: '14', id_usuario: 14 })],
    [
      'sin idUsuarioAuth ni id_usuario',
      ficha({ idUsuarioAuth: null, id_usuario: null }),
    ],
  ])('%s → null (no encontrado), nunca otro niño', async (_caso, cuerpo) => {
    fetchFalso.mockResolvedValue(json(cuerpo));
    await expect(crear().porIdUsuarioAuth(13n, 'tok')).resolves.toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it('404 → null', async () => {
    fetchFalso.mockResolvedValue(json({ error: 'no encontrado' }, 404));
    await expect(crear().porIdUsuarioAuth(13n, 'tok')).resolves.toBeNull();
  });

  it.each([
    ['500', () => json({ error: 'x' }, 500)],
    ['401', () => json({ error: 'x' }, 401)],
    ['cuerpo que no es JSON', () => new Response('<html>', { status: 200 })],
    ['lista en vez de objeto', () => json([ficha()])],
    ['sin idEstudiante', () => json(ficha({ idEstudiante: undefined }))],
    ['idEstudiante inválido', () => json(ficha({ idEstudiante: -3 }))],
  ])('%s → 503 (ServicioExternoNoDisponibleError)', async (_caso, r) => {
    fetchFalso.mockResolvedValue(r());
    await expect(crear().porIdUsuarioAuth(13n, 'tok')).rejects.toThrow(
      ServicioExternoNoDisponibleError,
    );
  });

  it('sin respuesta (red caída) → 503', async () => {
    fetchFalso.mockRejectedValue(new TypeError('fetch failed'));
    await expect(crear().porIdUsuarioAuth(13n, 'tok')).rejects.toThrow(
      ServicioExternoNoDisponibleError,
    );
  });

  it('timeout (ASISCO_API_TIMEOUT_MS) → 503', async () => {
    fetchFalso.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(init.signal?.reason),
          );
        }),
    );
    await expect(crear(500).porIdUsuarioAuth(13n, 'tok')).rejects.toThrow(
      ServicioExternoNoDisponibleError,
    );
  });

  it('nunca registra nombres, documentos ni diagnósticos', async () => {
    fetchFalso.mockResolvedValue(json(ficha({ idUsuarioAuth: '99' })));
    await crear().porIdUsuarioAuth(13n, 'tok');
    fetchFalso.mockResolvedValue(json({ nombre: 'Estudiante De Prueba' }));
    await crear()
      .porIdUsuarioAuth(13n, 'tok')
      .catch(() => undefined);
    const todo = warn.mock.calls.flat().join(' ');
    expect(todo).not.toMatch(/Estudiante De Prueba|0000000000|ficticio/);
  });
});
