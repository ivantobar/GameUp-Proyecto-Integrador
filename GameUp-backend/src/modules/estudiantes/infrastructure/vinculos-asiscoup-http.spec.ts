import { ServicioExternoNoDisponibleError } from '../../../common/errors/dominio.errors.js';
import { ConsultaVinculosAsiscoUpHttp } from './vinculos-asiscoup-http.js';

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Forma real de ASISCO UP (2026-11-08), con datos de prueba. */
const respuesta = (estudiantes: unknown[] = [estudiante()]) => ({
  acudiente: { idAcudiente: 7, idUsuarioAuth: '15', id_usuario: 15 },
  estudiantes,
});
const estudiante = (extra: Record<string, unknown> = {}) => ({
  idEstudiante: 12,
  idUsuarioAuth: '13',
  nombre: 'Estudiante GameUP',
  esPrincipal: true,
  parentesco: { idParentesco: 1, nombre: 'Madre' },
  ...extra,
});

describe('ConsultaVinculosAsiscoUpHttp', () => {
  let fetchFalso: ReturnType<typeof vi.fn>;
  const crear = () => {
    const c = new ConsultaVinculosAsiscoUpHttp('https://asiscoup.test/', 5000);
    vi.spyOn(c['logger'], 'warn').mockImplementation(() => undefined);
    return c;
  };

  beforeEach(() => {
    fetchFalso = vi.fn(async () => json(respuesta()));
    vi.stubGlobal('fetch', fetchFalso);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('reenvía el token del acudiente a /acudientes/me/estudiantes', async () => {
    await crear().deAcudiente('tok');
    const [url, init] = fetchFalso.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://asiscoup.test/api/acudientes/me/estudiantes');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer tok',
    );
  });

  it('devuelve solo ids, parentesco y principal', async () => {
    await expect(crear().deAcudiente('tok')).resolves.toEqual({
      idUsuarioAuth: 15n,
      estudiantes: [
        { idEstudianteExterno: 12n, parentesco: 'Madre', esPrincipal: true },
      ],
    });
  });

  it('sin parentesco ni principal → "Acudiente", no principal', async () => {
    fetchFalso.mockResolvedValue(
      json(
        respuesta([estudiante({ parentesco: null, esPrincipal: undefined })]),
      ),
    );
    const r = await crear().deAcudiente('tok');
    expect(r.estudiantes[0]).toMatchObject({
      parentesco: 'Acudiente',
      esPrincipal: false,
    });
  });

  it('lista vacía es válida', async () => {
    fetchFalso.mockResolvedValue(json(respuesta([])));
    await expect(crear().deAcudiente('tok')).resolves.toEqual({
      idUsuarioAuth: 15n,
      estudiantes: [],
    });
  });

  it.each([
    ['401', () => json({ error: 'x' }, 401)],
    ['500', () => json({ error: 'x' }, 500)],
    ['sin acudiente', () => json({ estudiantes: [] })],
    [
      'acudiente sin idUsuarioAuth',
      () =>
        json({
          acudiente: { idAcudiente: 7, idUsuarioAuth: null },
          estudiantes: [],
        }),
    ],
    [
      'estudiante sin id',
      () => json(respuesta([estudiante({ idEstudiante: null })])),
    ],
  ])('%s → servicio no disponible', async (_n, resp) => {
    fetchFalso.mockResolvedValue(resp());
    await expect(crear().deAcudiente('tok')).rejects.toBeInstanceOf(
      ServicioExternoNoDisponibleError,
    );
  });

  it('sin respuesta → servicio no disponible', async () => {
    fetchFalso.mockRejectedValue(new Error('timeout'));
    await expect(crear().deAcudiente('tok')).rejects.toBeInstanceOf(
      ServicioExternoNoDisponibleError,
    );
  });
});
