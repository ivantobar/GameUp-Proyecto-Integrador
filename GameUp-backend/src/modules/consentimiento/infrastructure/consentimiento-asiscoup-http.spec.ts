import { ServicioExternoNoDisponibleError } from '../../../common/errors/dominio.errors.js';
import { ConsultaConsentimientoAsiscoUpHttp } from './consentimiento-asiscoup-http.js';

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Forma real de ASISCO UP (2026-11-07), con datos de prueba. */
const vigente = (extra: Record<string, unknown> = {}) => ({
  idEstudiante: 1,
  versionVigente: { idVersionTerminos: 1, codigoVersion: 'v1.0-2026' },
  tieneConsentimientoVigente: true,
  requiereAceptarTerminos: false,
  consentimientos: [
    {
      idEstudiante: 1,
      idAcudiente: 1,
      idVersionTerminos: 1,
      aceptaTratamiento: true,
      fechaOtorgamiento: '2026-11-07T02:53:39.356Z',
      codigoVersion: 'v1.0-2026',
    },
  ],
  ...extra,
});

describe('ConsultaConsentimientoAsiscoUpHttp', () => {
  let fetchFalso: ReturnType<typeof vi.fn>;
  const crear = () => {
    const c = new ConsultaConsentimientoAsiscoUpHttp(
      'https://asiscoup.test/',
      5000,
    );
    vi.spyOn(c['logger'], 'warn').mockImplementation(() => undefined);
    return c;
  };

  beforeEach(() => {
    fetchFalso = vi.fn(async () => json(vigente()));
    vi.stubGlobal('fetch', fetchFalso);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('consulta la ruta del estudiante externo', async () => {
    await crear().vigente(990001n);
    const [url] = fetchFalso.mock.calls[0] as [string];
    expect(url).toBe(
      'https://asiscoup.test/api/estudiantes/990001/consentimiento',
    );
  });

  it('vigente y al día → acepta, con la versión', async () => {
    await expect(crear().vigente(1n)).resolves.toEqual({
      aceptaTratamiento: true,
      codigoVersion: 'v1.0-2026',
    });
  });

  it('términos nuevos sin aceptar → no acepta', async () => {
    fetchFalso.mockResolvedValue(
      json(vigente({ requiereAceptarTerminos: true })),
    );
    await expect(crear().vigente(1n)).resolves.toEqual({
      aceptaTratamiento: false,
      codigoVersion: 'v1.0-2026',
    });
  });

  it('sin consentimiento vigente → no acepta', async () => {
    fetchFalso.mockResolvedValue(
      json(vigente({ tieneConsentimientoVigente: false, consentimientos: [] })),
    );
    await expect(crear().vigente(1n)).resolves.toMatchObject({
      aceptaTratamiento: false,
    });
  });

  it('404 (estudiante desconocido) → null', async () => {
    fetchFalso.mockResolvedValue(
      json({ error: 'Estudiante con id 1 no fue encontrado' }, 404),
    );
    await expect(crear().vigente(1n)).resolves.toBeNull();
  });

  it.each([
    ['500', () => json({ error: 'x' }, 500)],
    ['formato inesperado', () => json({ algo: 1 })],
    ['vigente sin versión', () => json(vigente({ versionVigente: null }))],
  ])('%s → servicio no disponible (falla cerrado)', async (_n, resp) => {
    fetchFalso.mockResolvedValue(resp());
    await expect(crear().vigente(1n)).rejects.toBeInstanceOf(
      ServicioExternoNoDisponibleError,
    );
  });

  it('sin respuesta → servicio no disponible', async () => {
    fetchFalso.mockRejectedValue(new Error('timeout'));
    await expect(crear().vigente(1n)).rejects.toBeInstanceOf(
      ServicioExternoNoDisponibleError,
    );
  });
});
