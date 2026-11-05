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

const actividad = (configuracion: Record<string, unknown>) => ({
  id: '20',
  moduloId: '3',
  tipoJuego: { id: '1', codigo: 'EMPAREJAR', nombre: 'Emparejar' },
  titulo: 'Emparejar',
  instruccionTexto: null,
  configuracion,
  orden: 0,
  activa: true,
});

const ronda = (estimulo: Record<string, unknown>) => ({
  rondas: [
    {
      pregunta: '¿Qué es?',
      estimulo,
      opciones: [
        { etiqueta: 'a', texto: 'a' },
        { etiqueta: 'e', texto: 'e' },
      ],
      respuesta: 0,
    },
  ],
});

describe('contenido de Emparejar desde el backend', () => {
  it('solo texto: no pide URLs de imágenes', async () => {
    const { repos, requests } = setup(() =>
      jsonResponse(200, actividad(ronda({ etiqueta: 'a', texto: 'a' }))),
    );

    const content = await repos.activities.getActivity('20');

    expect(content.gameId).toBe('match');
    expect(requests.map((r) => r.url)).toEqual([`${BASE}/actividades/20`]);
  });

  it('con imágenes: una sola llamada a las URLs firmadas del módulo', async () => {
    const { repos, requests } = setup(({ url }) =>
      url.endsWith('/contenidos/urls')
        ? jsonResponse(200, [
            {
              contenidoId: '14',
              url: 'https://storage.prueba/a.png',
              expiraEn: '2026-11-05T16:00:00.000Z',
            },
          ])
        : jsonResponse(
            200,
            actividad(ronda({ etiqueta: 'a', imagenContenidoId: '14' })),
          ),
    );

    const content = await repos.activities.getActivity('20');

    expect(requests.map((r) => r.url)).toEqual([
      `${BASE}/actividades/20`,
      `${BASE}/modulos/3/contenidos/urls`,
    ]);
    if (content.gameId !== 'match') throw new Error('no es Emparejar');
    expect(content.rounds[0]?.prompt.imageUri).toBe(
      'https://storage.prueba/a.png',
    );
  });

  it('si las imágenes no cargan, el juego sigue con sus etiquetas', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { repos } = setup(({ url }) =>
      url.endsWith('/contenidos/urls')
        ? errorResponse(503, 'Storage no configurado')
        : jsonResponse(
            200,
            actividad(ronda({ etiqueta: 'a', imagenContenidoId: '14' })),
          ),
    );

    const content = await repos.activities.getActivity('20');

    if (content.gameId !== 'match') throw new Error('no es Emparejar');
    expect(content.rounds[0]?.prompt).toEqual({ id: 'r0-e', label: 'a' });
    warn.mockRestore();
  });
});

const intento = {
  id: '50',
  asignacionId: '1',
  actividadId: '21',
  tipoJuego: 'MEMORIA',
  numeroIntento: 1,
  resultado: {},
  estrellas: 0,
  fecha: '2026-11-05T15:00:00.000Z',
  estado: 'PENDIENTE_VALIDACION',
  validacion: null,
  tieneAudio: false,
};

describe('envío de Emparejar, Clasificar, Secuenciar y Memoria', () => {
  it('turnos: POST /intentos con { firstTryCorrect, total }', async () => {
    const { repos, requests } = setup(() => jsonResponse(201, intento));

    const result = await repos.results.submitGameResult({
      studentId: '5',
      gameId: 'sequence',
      score: { kind: 'turns', firstTryCorrect: 2, total: 3 },
      activityId: '22',
    });

    expect(requests[0]).toMatchObject({
      url: `${BASE}/intentos`,
      method: 'POST',
      body: { actividadId: '22', resultado: { firstTryCorrect: 2, total: 3 } },
    });
    expect(result).toMatchObject({
      gameId: 'sequence',
      status: 'pending_validation',
      sentForReview: true,
    });
  });

  it('Memoria: POST /intentos con { pairs, mismatches }', async () => {
    const { repos, requests } = setup(() => jsonResponse(201, intento));

    await repos.results.submitGameResult({
      studentId: '5',
      gameId: 'memory',
      score: { kind: 'memory', pairs: 3, mismatches: 1 },
      activityId: '21',
    });

    expect(requests[0]?.body).toEqual({
      actividadId: '21',
      resultado: { pairs: 3, mismatches: 1 },
    });
  });

  it('juego libre: no se envía nada (D1)', async () => {
    const { repos, fetchFn } = setup(() => jsonResponse(201, intento));

    const result = await repos.results.submitGameResult({
      studentId: '5',
      gameId: 'match',
      score: { kind: 'turns', firstTryCorrect: 3, total: 3 },
    });

    expect(fetchFn).not.toHaveBeenCalled();
    expect(result.sentForReview).toBe(false);
  });
});
