import { createApiClient } from '@/services/api';
import {
  createFakeFetch,
  errorResponse,
  jsonResponse,
  type FakeHandler,
} from '@/test-utils/fakeFetch';
import {
  LevelChangeError,
  SOLO_DIRECTORA_SUBE,
  StudentAccessError,
} from '../../studentErrors';
import { createHttpLevelRepository } from '../httpLevelRepository';

const BASE = 'http://api.prueba/api/v1';

function setup(handler: FakeHandler) {
  const fake = createFakeFetch(handler);
  const api = createApiClient({
    baseUrl: BASE,
    getToken: () => Promise.resolve('jwt'),
    fetchFn: fake.fetchFn,
  });
  return { levels: createHttpLevelRepository(api), ...fake };
}

const cambio = {
  studentId: '10',
  gameId: 'memory' as const,
  level: 2,
  reason: '  Repasar las parejas  ',
};

describe('cambiar el nivel a mano (HTTP)', () => {
  it('PUT con el código del juego, el nivel y el motivo sin espacios de más', async () => {
    const { levels, requests } = setup(() =>
      jsonResponse(200, {
        juego: 'MEMORIA',
        nombre: 'Memoria',
        nivelActual: 2,
        nivelMaximo: 5,
        completado: false,
        pendientesValidacion: 0,
        actualizadoEn: '2026-11-12T15:00:00.000Z',
      }),
    );

    await expect(levels.setStudentLevel(cambio)).resolves.toEqual({
      gameId: 'memory',
      level: 2,
      completed: false,
      pendingReview: 0,
    });
    expect(requests[0]).toMatchObject({
      url: `${BASE}/estudiantes/10/niveles-juego/MEMORIA`,
      method: 'PUT',
      body: { nivel: 2, motivo: 'Repasar las parejas' },
    });
  });

  it('403 (la tallerista intenta subir) → notAllowed con el mensaje del backend', async () => {
    const { levels } = setup(() => errorResponse(403, SOLO_DIRECTORA_SUBE));
    const error = await levels.setStudentLevel(cambio).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(LevelChangeError);
    expect(error).toMatchObject({
      problem: 'notAllowed',
      detail: SOLO_DIRECTORA_SUBE,
    });
  });

  it.each([
    [422, 'invalid'],
    [400, 'invalid'],
    [409, 'changed'],
  ])('%i → %s, con el mensaje del backend', async (status, problem) => {
    const { levels } = setup(() =>
      errorResponse(status, 'Detalle del backend'),
    );
    await expect(levels.setStudentLevel(cambio)).rejects.toMatchObject({
      problem,
      detail: 'Detalle del backend',
    });
  });

  it('404 → StudentAccessError', async () => {
    const { levels } = setup(() => errorResponse(404, 'No existe'));
    await expect(levels.setStudentLevel(cambio)).rejects.toBeInstanceOf(
      StudentAccessError,
    );
  });
});
