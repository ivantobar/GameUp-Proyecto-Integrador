import { ServicioExternoNoDisponibleError } from '../../../common/errors/dominio.errors.js';
import { ConsultaConsentimientoAsiscoUpHttp } from './consentimiento-asiscoup-http.js';

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** El estudiante por el que se pregunta: id_usuario central 47, idEstudiante 23. */
const IDS = { idUsuarioAuth: 47n, idEstudianteExterno: 23n };

/**
 * Forma real de GET /api/estudiantes/por-usuario/{id}/consentimiento
 * (probada el 2026-11-09), con datos de prueba.
 */
const vigente = (extra: Record<string, unknown> = {}) => ({
  idEstudiante: 23,
  id_usuario: 47,
  idUsuarioAuth: '47',
  versionVigente: {
    idVersionTerminos: 2,
    codigoVersion: 'v1.1-2026',
    textoLegal: 'Términos y autorización — versión v1.1-2026...',
  },
  tieneConsentimientoVigente: true,
  autorizaGrabacionVoz: true,
  requiereAceptarTerminos: false,
  consentimientos: [
    {
      idEstudiante: 23,
      idAcudiente: 18,
      idVersionTerminos: 2,
      aceptaTratamiento: true,
      aceptaGrabacionVoz: true,
      fechaOtorgamiento: '2026-11-08T18:43:00.272Z',
      codigoVersion: 'v1.1-2026',
    },
  ],
  ...extra,
});

describe('ConsultaConsentimientoAsiscoUpHttp', () => {
  let fetchFalso: ReturnType<typeof vi.fn>;
  let warn: ReturnType<typeof vi.spyOn>;
  const crear = () => {
    const c = new ConsultaConsentimientoAsiscoUpHttp(
      'https://asiscoup.test/',
      5000,
    );
    warn = vi.spyOn(c['logger'], 'warn').mockImplementation(() => undefined);
    return c;
  };

  beforeEach(() => {
    fetchFalso = vi.fn(async () => json(vigente()));
    vi.stubGlobal('fetch', fetchFalso);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('consulta por el id_usuario central (no por el idEstudiante de ASISCO UP)', async () => {
    await crear().vigente(IDS);
    const [url] = fetchFalso.mock.calls[0] as [string];
    expect(url).toBe(
      'https://asiscoup.test/api/estudiantes/por-usuario/47/consentimiento',
    );
  });

  it('reenvía el token de quien consulta (ASISCO UP responde 401 sin él)', async () => {
    await crear().vigente(IDS, 'jwt-de-prueba');
    const [, init] = fetchFalso.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer jwt-de-prueba',
    });
  });

  it('sin token no manda Authorization', async () => {
    await crear().vigente(IDS);
    const [, init] = fetchFalso.mock.calls[0] as [string, RequestInit];
    expect(init.headers).not.toHaveProperty('Authorization');
  });

  it('401 de ASISCO UP → no verificable (no se graba)', async () => {
    fetchFalso.mockResolvedValue(json({ error: 'Falta Bearer' }, 401));
    await expect(crear().vigente(IDS)).rejects.toBeInstanceOf(
      ServicioExternoNoDisponibleError,
    );
  });

  it('vigente y autoriza la voz → acepta, con la versión', async () => {
    await expect(crear().vigente(IDS)).resolves.toEqual({
      aceptaTratamiento: true,
      codigoVersion: 'v1.1-2026',
    });
  });

  it('acepta con solo uno de los dos campos de id_usuario', async () => {
    fetchFalso.mockResolvedValue(json(vigente({ idUsuarioAuth: undefined })));
    await expect(crear().vigente(IDS)).resolves.toMatchObject({
      aceptaTratamiento: true,
    });
    fetchFalso.mockResolvedValue(json(vigente({ id_usuario: undefined })));
    await expect(crear().vigente(IDS)).resolves.toMatchObject({
      aceptaTratamiento: true,
    });
  });

  it('acepta los datos pero no la voz → no acepta', async () => {
    fetchFalso.mockResolvedValue(
      json(vigente({ autorizaGrabacionVoz: false })),
    );
    await expect(crear().vigente(IDS)).resolves.toEqual({
      aceptaTratamiento: false,
      codigoVersion: 'v1.1-2026',
    });
  });

  it('sin autorizaGrabacionVoz → no acepta', async () => {
    const { autorizaGrabacionVoz: _omitido, ...sinCampo } = vigente();
    fetchFalso.mockResolvedValue(json(sinCampo));
    await expect(crear().vigente(IDS)).resolves.toMatchObject({
      aceptaTratamiento: false,
    });
  });

  it('términos nuevos sin aceptar → no acepta', async () => {
    fetchFalso.mockResolvedValue(
      json(vigente({ requiereAceptarTerminos: true })),
    );
    await expect(crear().vigente(IDS)).resolves.toMatchObject({
      aceptaTratamiento: false,
    });
  });

  it('sin consentimiento vigente → no acepta', async () => {
    fetchFalso.mockResolvedValue(
      json(
        vigente({
          tieneConsentimientoVigente: false,
          autorizaGrabacionVoz: false,
        }),
      ),
    );
    await expect(crear().vigente(IDS)).resolves.toMatchObject({
      aceptaTratamiento: false,
    });
  });

  it('404 (sin estudiante con ese id_usuario) → null', async () => {
    fetchFalso.mockResolvedValue(
      json(
        {
          error:
            'Estudiante con id_usuario de Seguridad con id 47 no fue encontrado',
        },
        404,
      ),
    );
    await expect(crear().vigente(IDS)).resolves.toBeNull();
  });

  it.each([
    ['500', () => json({ error: 'x' }, 500)],
    ['formato inesperado', () => json({ algo: 1 })],
    ['vigente sin versión', () => json(vigente({ versionVigente: null }))],
    ['idEstudiante distinto', () => json(vigente({ idEstudiante: 24 }))],
    ['sin idEstudiante', () => json(vigente({ idEstudiante: undefined }))],
    ['id_usuario distinto', () => json(vigente({ id_usuario: 48 }))],
    ['idUsuarioAuth distinto', () => json(vigente({ idUsuarioAuth: '48' }))],
    [
      'sin id_usuario ni idUsuarioAuth',
      () => json(vigente({ id_usuario: undefined, idUsuarioAuth: undefined })),
    ],
  ])('%s → servicio no disponible (NO_VERIFICABLE)', async (_n, resp) => {
    fetchFalso.mockResolvedValue(resp());
    await expect(crear().vigente(IDS)).rejects.toBeInstanceOf(
      ServicioExternoNoDisponibleError,
    );
  });

  it('nunca registra el textoLegal ni los datos de la respuesta', async () => {
    fetchFalso.mockResolvedValue(json(vigente({ idEstudiante: 24 })));
    await expect(crear().vigente(IDS)).rejects.toThrow();
    const registrado = JSON.stringify(warn.mock.calls);
    expect(registrado).not.toContain('Términos');
    expect(registrado).not.toContain('2026-11-08');
  });

  it('sin respuesta → servicio no disponible', async () => {
    fetchFalso.mockRejectedValue(new Error('timeout'));
    await expect(crear().vigente(IDS)).rejects.toBeInstanceOf(
      ServicioExternoNoDisponibleError,
    );
  });
});
