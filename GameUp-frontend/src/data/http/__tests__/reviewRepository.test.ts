import { createApiClient } from '@/services/api';
import {
  createFakeFetch,
  errorResponse,
  jsonResponse,
  type FakeHandler,
} from '@/test-utils/fakeFetch';
import { ListenFirstError } from '../../reviewErrors';
import type { ItemRevisionDto } from '../dto/revisiones';
import { createHttpReviewRepository } from '../httpReviewRepository';
import { toReviewItem } from '../mappers/reviewMapper';

const BASE = 'http://api.prueba/api/v1';

const base: ItemRevisionDto = {
  intentoId: '41',
  tipo: 'VOZ',
  tipoJuego: 'HABLA_CONMIGO',
  estudiante: { id: '5', displayName: 'Estrella P.', initials: 'EP' },
  actividad: { id: '1', titulo: 'Di la a', vocal: 'a' },
  modulo: { id: '1', nombre: 'Vocales de prueba' },
  fecha: '2026-11-05T21:07:55.000Z',
  numeroIntento: 1,
  pendientesMismaActividad: 1,
  resultado: { estadoGrabacion: 'NO_VERIFICABLE' },
  consentimientoVoz: false,
  grabacion: null,
};

describe('bandeja del backend → «Por escuchar»', () => {
  it('voz sin grabación (NO_VERIFICABLE): explica el motivo y no hay audio que esperar', () => {
    expect(toReviewItem(base)).toEqual({
      id: '41',
      kind: 'speech',
      student: { id: '5', displayName: 'Estrella P.', initials: 'EP' },
      submittedAt: '2026-11-05T21:07:55.000Z',
      status: 'pending_validation',
      speech: {
        vowel: 'a',
        audioUri: null,
        remoteAudio: false,
        audioExpired: false,
        voiceConsent: false,
        noAudioReason: 'notVerified',
        attemptNumber: 1,
        attemptsTotal: 1,
      },
    });
  });

  it.each([
    ['SIN_CONSENTIMIENTO', 'noConsent'],
    ['NO_ENVIADA', 'notSent'],
    ['NO_GUARDADA', 'notSaved'],
  ])('%s → %s', (estado, reason) => {
    expect(
      toReviewItem({ ...base, resultado: { estadoGrabacion: estado } }).speech
        ?.noAudioReason,
    ).toBe(reason);
  });

  it('voz con audio: hay que pedirlo al servidor (remoteAudio)', () => {
    const speech = toReviewItem({
      ...base,
      resultado: { estadoGrabacion: 'ADJUNTA' },
      consentimientoVoz: true,
      grabacion: { disponible: true, vencido: false },
    }).speech;
    expect(speech).toMatchObject({ remoteAudio: true, voiceConsent: true });
    expect(speech?.noAudioReason).toBeUndefined();
  });

  it('voz con audio vencido (30 días): sin audio, sin bloqueo', () => {
    expect(
      toReviewItem({
        ...base,
        resultado: { estadoGrabacion: 'ADJUNTA' },
        grabacion: { disponible: false, vencido: true },
      }).speech,
    ).toMatchObject({ remoteAudio: false, audioExpired: true });
  });

  it('«intento n de n» nunca dice un total menor que el intento', () => {
    expect(
      toReviewItem({ ...base, numeroIntento: 2, pendientesMismaActividad: 1 })
        .speech,
    ).toMatchObject({ attemptNumber: 2, attemptsTotal: 2 });
  });

  it('Busca la boca y los juegos de «Pensar y recordar»', () => {
    const boca = toReviewItem({
      ...base,
      tipo: 'JUEGO',
      tipoJuego: 'BUSCA_LA_BOCA',
      actividad: { id: '3', titulo: 'Busca la boca', vocal: null },
      resultado: { firstTryCorrect: 4, total: 5 },
      consentimientoVoz: null,
    });
    expect(boca).toMatchObject({
      kind: 'listening',
      listening: { firstTryCorrect: 4, total: 5 },
    });

    const memoria = toReviewItem({
      ...base,
      tipo: 'JUEGO',
      tipoJuego: 'MEMORIA',
      actividad: { id: '7', titulo: 'Parejas de vocales', vocal: null },
      resultado: { pairs: 3, mismatches: 1 },
      consentimientoVoz: null,
    });
    expect(memoria).toMatchObject({
      kind: 'game',
      game: {
        gameId: 'memory',
        title: 'Parejas de vocales',
        score: { kind: 'memory', pairs: 3, mismatches: 1 },
      },
    });

    const secuenciar = toReviewItem({
      ...base,
      tipo: 'JUEGO',
      tipoJuego: 'SECUENCIAR',
      actividad: { id: '6', titulo: 'Las vocales en orden', vocal: null },
      resultado: { firstTryCorrect: 3, total: 3 },
      consentimientoVoz: null,
    });
    expect(secuenciar.game?.score).toEqual({
      kind: 'turns',
      firstTryCorrect: 3,
      total: 3,
    });
  });
});

function setup(handler: FakeHandler) {
  const fake = createFakeFetch(handler);
  const api = createApiClient({
    baseUrl: BASE,
    getToken: () => Promise.resolve('jwt'),
    fetchFn: fake.fetchFn,
  });
  return { reviews: createHttpReviewRepository(api), ...fake };
}

describe('ReviewRepository (HTTP)', () => {
  it('pide la bandeja de quien tiene la sesión (el backend filtra)', async () => {
    const { reviews, requests } = setup(() =>
      jsonResponse(200, { items: [base], total: 1, page: 1, limit: 50 }),
    );

    const items = await reviews.listPendingReviews('3');

    expect(items).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      url: `${BASE}/revisiones/pendientes?limit=50`,
      method: 'GET',
      headers: { Authorization: 'Bearer jwt' },
    });
  });

  it('con un estudiante, añade estudianteId a la URL (codificado)', async () => {
    const { reviews, requests } = setup(() =>
      jsonResponse(200, { items: [], total: 0, page: 1, limit: 50 }),
    );

    await reviews.listPendingReviews('3', '5');
    await reviews.listPendingReviews('3', '5&limit=1 x');

    expect(requests[0]?.url).toBe(
      `${BASE}/revisiones/pendientes?limit=50&estudianteId=5`,
    );
    expect(requests[1]?.url).toBe(
      `${BASE}/revisiones/pendientes?limit=50&estudianteId=5%26limit%3D1%20x`,
    );
  });

  it('resumen: GET /revisiones/pendientes/resumen → estudiantes con sus conteos', async () => {
    const { reviews, requests } = setup(() =>
      jsonResponse(200, [
        {
          estudianteId: '5',
          nombre: 'Estrella P.',
          iniciales: 'EP',
          pendientes: 3,
          masAntiguo: '2026-11-05T21:07:55.000Z',
        },
      ]),
    );

    await expect(reviews.listPendingSummary('3')).resolves.toEqual([
      {
        student: { id: '5', displayName: 'Estrella P.', initials: 'EP' },
        pending: 3,
        oldestAt: '2026-11-05T21:07:55.000Z',
      },
    ]);
    expect(requests[0]).toMatchObject({
      url: `${BASE}/revisiones/pendientes/resumen`,
      method: 'GET',
    });
  });

  it('resumen con una forma inesperada → error claro (no datos a medias)', async () => {
    const { reviews } = setup(() =>
      jsonResponse(200, [{ estudianteId: '5', nombre: 'Estrella P.' }]),
    );

    await expect(reviews.listPendingSummary('3')).rejects.toThrow(
      'Respuesta inesperada del servidor: iniciales',
    );
  });

  it('«Lo logró»: POST /intentos/:id/validacion con APROBADO', async () => {
    const { reviews, requests } = setup(() => jsonResponse(201, {}));

    await reviews.validate('41');

    expect(requests[0]).toMatchObject({
      url: `${BASE}/intentos/41/validacion`,
      method: 'POST',
      body: { resultado: 'APROBADO' },
    });
  });

  it('«Practicar más»: RECHAZADO con la retroalimentación', async () => {
    const { reviews, requests } = setup(() => jsonResponse(201, {}));

    await reviews.requestMorePractice('41', '  Abre más la boca.  ');

    expect(requests[0]?.body).toEqual({
      resultado: 'RECHAZADO',
      retroalimentacion: 'Abre más la boca.',
    });
  });

  it('sin retroalimentación no se envía (igual que la versión simulada)', async () => {
    const { reviews, fetchFn } = setup(() => jsonResponse(201, {}));

    await expect(reviews.requestMorePractice('41', '   ')).rejects.toThrow(
      'obligatoria',
    );
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('422 «escucha la grabación» se vuelve ListenFirstError', async () => {
    const { reviews } = setup(() =>
      errorResponse(
        422,
        'Antes de validar, escucha la grabación de este intento.',
      ),
    );

    await expect(reviews.validate('41')).rejects.toBeInstanceOf(
      ListenFirstError,
    );
  });

  it('el audio se pide con su URL firmada', async () => {
    const { reviews, requests } = setup(() =>
      jsonResponse(200, {
        url: 'https://storage.prueba/voz.m4a?firma=x',
        expiraEn: '2026-11-05T21:20:00.000Z',
      }),
    );

    await expect(reviews.getRecordingUrl('41')).resolves.toBe(
      'https://storage.prueba/voz.m4a?firma=x',
    );
    expect(requests[0]?.url).toBe(`${BASE}/intentos/41/grabacion`);
  });

  it('nota para la familia: observación visible para el acudiente', async () => {
    const { reviews, requests } = setup(() => jsonResponse(201, {}));

    await reviews.shareNoteWithFamily('5', ' Practiquen la a. ');

    expect(requests[0]).toMatchObject({
      url: `${BASE}/estudiantes/5/observaciones`,
      method: 'POST',
      body: { texto: 'Practiquen la a.', visibleAcudiente: true },
    });
  });

  it('con la API no hay nota de voz para la familia (D4)', async () => {
    const { reviews, fetchFn } = setup(() => jsonResponse(201, {}));

    expect(reviews.features).toEqual({
      familyVoiceNote: false,
      feedbackAlwaysReachesFamily: false,
    });
    await expect(
      reviews.saveFamilyVoiceNote('5', 'file:///nota.m4a'),
    ).rejects.toThrow('Todavía no está disponible');
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
