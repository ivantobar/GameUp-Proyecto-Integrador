import { createApiClient } from '@/services/api';
import {
  createFakeFetch,
  errorResponse,
  jsonResponse,
  type FakeHandler,
} from '@/test-utils/fakeFetch';
import { createHttpRepositories } from '../createHttpRepositories';
import { createMemoryTokenStore } from '../tokenStore';

const BASE = 'http://api.prueba/api/v1';

function setup(handler: FakeHandler) {
  const fake = createFakeFetch(handler);
  const api = createApiClient({
    baseUrl: BASE,
    getToken: () => Promise.resolve('jwt'),
    fetchFn: fake.fetchFn,
  });
  return {
    repos: createHttpRepositories(api, createMemoryTokenStore('jwt')),
    ...fake,
  };
}

/**
 * FormData de React Native: acepta `{ uri, name, type }` para subir un
 * archivo local. El de Node (Jest) lo convertiría a texto, así que aquí se
 * usa uno que guarda lo que recibe.
 */
class RecordingFormData {
  readonly parts: [string, unknown][] = [];
  append(name: string, value: unknown) {
    this.parts.push([name, value]);
  }
}
const realFormData = globalThis.FormData;
beforeEach(() => {
  globalThis.FormData = RecordingFormData as unknown as typeof FormData;
});
afterEach(() => {
  globalThis.FormData = realFormData;
});

/** Espera la promesa avanzando el reloj simulado (reintentos). */
async function settle<T>(promise: Promise<T>): Promise<T> {
  const outcome = promise.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  );
  await jest.runAllTimersAsync();
  const result = await outcome;
  if (result.ok) return result.value;
  throw result.error;
}

describe('lecturas del estudiante (rutas /me con su token)', () => {
  it.each([
    ['practice.getVowelPractice', '/estudiantes/me/practica-vocales', []],
    [
      'practice.getResumePoint',
      '/estudiantes/me/punto-retorno',
      { puntoRetorno: null },
    ],
    [
      'assignments.listPendingForStudent',
      '/estudiantes/me/actividades-pendientes',
      [],
    ],
    [
      'progress.getOfficialProgress',
      '/estudiantes/me/progreso',
      { modulos: [], pendientesValidacion: 0 },
    ],
    [
      'consent.hasVoiceRecordingConsent',
      '/estudiantes/me/consentimiento-voz',
      {
        concedido: false,
        motivo: 'NO_VERIFICABLE',
        verificadoEn: '2026-11-05T15:00:00.000Z',
      },
    ],
  ] as const)('%s → GET %s', async (method, path, response) => {
    const { repos, requests } = setup(() => jsonResponse(200, response));
    const [group, name] = method.split('.') as [string, string];
    const fn = (
      repos as unknown as Record<
        string,
        Record<string, (id: string) => Promise<unknown>>
      >
    )[group]?.[name];
    if (!fn) throw new Error(`Falta ${method}`);

    await fn('5');

    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      url: `${BASE}${path}`,
      method: 'GET',
      headers: { Authorization: 'Bearer jwt' },
    });
  });

  it('el consentimiento falla cerrado: solo `concedido: true` deja grabar', async () => {
    const no = setup(() => jsonResponse(200, { concedido: false }));
    const si = setup(() => jsonResponse(200, { concedido: true }));
    const raro = setup(() => jsonResponse(200, { concedido: 'true' }));

    await expect(no.repos.consent.hasVoiceRecordingConsent('5')).resolves.toBe(
      false,
    );
    await expect(si.repos.consent.hasVoiceRecordingConsent('5')).resolves.toBe(
      true,
    );
    await expect(
      raro.repos.consent.hasVoiceRecordingConsent('5'),
    ).resolves.toBe(false);
  });

  it('la actividad se pide por su id', async () => {
    const { repos, requests } = setup(() =>
      jsonResponse(200, {
        id: '9',
        moduloId: '1',
        tipoJuego: {
          id: '6',
          codigo: 'BUSCA_LA_BOCA',
          nombre: 'Busca la boca',
        },
        titulo: 'Busca la boca',
        instruccionTexto: null,
        configuracion: { vocales: ['a', 'e'] },
        orden: 0,
        activa: true,
      }),
    );

    await expect(repos.activities.getActivity('9')).resolves.toMatchObject({
      gameId: 'findMouth',
      vowels: ['a', 'e'],
    });
    expect(requests[0]?.url).toBe(`${BASE}/actividades/9`);
  });

  it('las estrellas las suma el backend: recordPracticeCycle solo lee', async () => {
    const { repos, requests } = setup(() =>
      jsonResponse(200, [{ vocal: 'o', estrellas: 2 }]),
    );

    await expect(repos.practice.recordPracticeCycle('5', 'o')).resolves.toBe(2);
    expect(requests.map((r) => r.method)).toEqual(['GET']);
  });
});

const intento = {
  id: '40',
  asignacionId: '1',
  actividadId: '9',
  tipoJuego: 'BUSCA_LA_BOCA',
  numeroIntento: 1,
  resultado: { firstTryCorrect: 4, total: 5 },
  estrellas: 0,
  fecha: '2026-11-05T15:00:00.000Z',
  estado: 'PENDIENTE_VALIDACION',
  validacion: null,
  tieneAudio: false,
};

describe('Busca la boca: envío del resultado', () => {
  it('desde una actividad: POST /intentos solo con actividadId y el resultado', async () => {
    const { repos, requests } = setup(() => jsonResponse(201, intento));

    const result = await repos.results.submitFindMouthResult({
      studentId: '5',
      firstTryCorrect: 4,
      total: 5,
      activityId: '9',
    });

    expect(requests[0]).toMatchObject({
      url: `${BASE}/intentos`,
      method: 'POST',
      // Regla 11: nada de tiempos, vidas ni penalizaciones.
      body: { actividadId: '9', resultado: { firstTryCorrect: 4, total: 5 } },
    });
    expect(result).toMatchObject({
      status: 'pending_validation',
      sentForReview: true,
    });
  });

  it('juego libre: no se envía nada al servidor (D1)', async () => {
    const { repos, fetchFn } = setup(() => jsonResponse(201, intento));

    const result = await repos.results.submitFindMouthResult({
      studentId: '5',
      firstTryCorrect: 3,
      total: 5,
    });

    expect(fetchFn).not.toHaveBeenCalled();
    expect(result.sentForReview).toBe(false);
  });

  it('si la red falla, reintenta en silencio y termina guardando', async () => {
    let calls = 0;
    const { repos } = setup(() => {
      calls += 1;
      if (calls === 1) throw new TypeError('Network request failed');
      return jsonResponse(201, intento);
    });

    const result = await settle(
      repos.results.submitFindMouthResult({
        studentId: '5',
        firstTryCorrect: 4,
        total: 5,
        activityId: '9',
      }),
    );

    expect(calls).toBe(2);
    expect(result.sentForReview).toBe(true);
  });

  it('un 422 (por ejemplo, total distinto) no se reintenta', async () => {
    const { repos, fetchFn } = setup(() =>
      errorResponse(422, 'resultado.total debe ser 5'),
    );

    await expect(
      settle(
        repos.results.submitFindMouthResult({
          studentId: '5',
          firstTryCorrect: 1,
          total: 3,
          activityId: '9',
        }),
      ),
    ).rejects.toMatchObject({ status: 422 });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});

describe('Habla conmigo: envío del intento', () => {
  const vozGuardada = {
    ...intento,
    tipoJuego: 'HABLA_CONMIGO',
    resultado: { estadoGrabacion: 'ADJUNTA' },
    estadoGrabacion: 'ADJUNTA',
    grabacionGuardada: true,
    estrellasPractica: 1,
    tieneAudio: true,
  };

  it('con voz autorizada: multipart con actividadId y el archivo .m4a', async () => {
    const { repos, requests } = setup(() => jsonResponse(201, vozGuardada));

    const attempt = await repos.recordings.submitSpeechAttempt({
      studentId: '5',
      vowel: 'a',
      audioUri: 'file:///cache/voz.m4a',
      activityId: '8',
    });

    const request = requests[0];
    expect(request).toMatchObject({
      url: `${BASE}/intentos/habla-conmigo`,
      method: 'POST',
      headers: { Authorization: 'Bearer jwt' },
    });
    // El separador del multipart lo pone fetch: no se fija Content-Type.
    expect(request?.headers['Content-Type']).toBeUndefined();
    expect((request?.rawBody as RecordingFormData).parts).toEqual([
      ['actividadId', '8'],
      [
        'audio',
        { uri: 'file:///cache/voz.m4a', name: 'voz.m4a', type: 'audio/mp4' },
      ],
    ]);
    expect(attempt).toMatchObject({
      audioUri: 'file:///cache/voz.m4a',
      status: 'pending_validation',
      sentForReview: true,
    });
  });

  it('sin voz (sin autorización): solo el actividadId, sin archivo', async () => {
    const { repos, requests } = setup(() =>
      jsonResponse(201, {
        ...vozGuardada,
        estadoGrabacion: 'NO_ENVIADA',
        grabacionGuardada: false,
        tieneAudio: false,
      }),
    );

    const attempt = await repos.recordings.submitSpeechAttempt({
      studentId: '5',
      vowel: 'a',
      audioUri: null,
      activityId: '8',
    });

    expect((requests[0]?.rawBody as RecordingFormData).parts).toEqual([
      ['actividadId', '8'],
    ]);
    expect(attempt.audioUri).toBeNull();
  });

  it('práctica libre: no se envía nada al servidor (D1)', async () => {
    const { repos, fetchFn } = setup(() => jsonResponse(201, vozGuardada));

    const attempt = await repos.recordings.submitSpeechAttempt({
      studentId: '5',
      vowel: 'e',
      audioUri: null,
    });

    expect(fetchFn).not.toHaveBeenCalled();
    expect(attempt.sentForReview).toBe(false);
  });
});
