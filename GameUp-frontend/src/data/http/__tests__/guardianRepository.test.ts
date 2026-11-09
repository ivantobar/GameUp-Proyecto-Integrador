import { createApiClient } from '@/services/api';
import {
  createFakeFetch,
  jsonResponse,
  type FakeHandler,
} from '@/test-utils/fakeFetch';
import { NoLinkedStudentsError } from '../../guardianErrors';
import type { ActividadEstudianteDto } from '../dto/acudiente';
import { createHttpGuardianRepository } from '../httpGuardianRepository';
import {
  activityFeedback,
  toWeeklyPractice,
  weekVowel,
} from '../mappers/guardianMapper';

const BASE = 'http://api.prueba/api/v1';

const actividad = (
  overrides: Partial<ActividadEstudianteDto>,
): ActividadEstudianteDto => ({
  actividadId: '1',
  titulo: 'Di la a',
  tipoJuego: 'HABLA_CONMIGO',
  orden: 0,
  vocal: 'a',
  estado: 'SIN_INTENTOS',
  intentos: 0,
  esNueva: true,
  retroalimentacion: null,
  asignacionId: '1',
  modulo: { id: '1', nombre: 'Vocales de prueba' },
  fechaSugerida: null,
  ...overrides,
});

const semana = {
  estudiante: { id: '5', displayName: 'Estrella P.', initials: 'EP' },
  hoy: '2026-11-05',
  dias: [
    { fecha: '2026-11-02', practicado: true },
    { fecha: '2026-11-03', practicado: false },
    { fecha: '2026-11-04', practicado: false },
    { fecha: '2026-11-05', practicado: false },
    { fecha: '2026-11-06', practicado: false },
    { fecha: '2026-11-07', practicado: false },
    { fecha: '2026-11-08', practicado: false },
  ],
  practicadoHoy: false,
};

const observacion = {
  id: '7',
  estudianteId: '5',
  autor: { id: '3', displayName: 'Tallerista Prueba' },
  texto: 'Practiquen la a frente al espejo.',
  visibleAcudiente: true,
  fecha: '2026-11-05T21:00:00.000Z',
};

describe('«Practicar en casa» desde tres rutas (decisión 5 de la fase 8)', () => {
  it('sonido de la semana: la vocal de Habla conmigo pendiente o para repetir', () => {
    expect(
      weekVowel([
        actividad({ vocal: 'a', estado: 'APROBADA' }),
        actividad({ actividadId: '2', vocal: 'o', estado: 'SIN_INTENTOS' }),
      ]),
    ).toBe('o');
    expect(weekVowel([actividad({ vocal: 'e', estado: 'RECHAZADA' })])).toBe(
      'e',
    );
  });

  it('sin una tarea de habla pendiente, no hay sonido de la semana', () => {
    expect(
      weekVowel([
        actividad({ estado: 'APROBADA' }),
        actividad({ estado: 'PENDIENTE_VALIDACION' }),
        actividad({ tipoJuego: 'BUSCA_LA_BOCA', vocal: null }),
      ]),
    ).toBeNull();
  });

  it('lo que dijo la profe: aprobadas (si dejó algo) y para repetir', () => {
    expect(
      activityFeedback([
        actividad({
          actividadId: '3',
          titulo: 'Busca la boca',
          tipoJuego: 'BUSCA_LA_BOCA',
          vocal: null,
          estado: 'RECHAZADA',
          retroalimentacion: 'Mira otra vez el gesto.',
        }),
        actividad({
          actividadId: '7',
          titulo: 'Parejas de vocales',
          tipoJuego: 'MEMORIA',
          vocal: null,
          estado: 'APROBADA',
          retroalimentacion: '¡Muy bien!',
        }),
        actividad({ actividadId: '1', estado: 'APROBADA' }),
        actividad({ actividadId: '2', estado: 'PENDIENTE_VALIDACION' }),
      ]),
    ).toEqual([
      {
        activityId: '3',
        title: 'Busca la boca',
        gameId: 'findMouth',
        status: 'rejected',
        text: 'Mira otra vez el gesto.',
      },
      {
        activityId: '7',
        title: 'Parejas de vocales',
        gameId: 'memory',
        status: 'validated',
        text: '¡Muy bien!',
      },
    ]);
  });

  it('arma la semana con la última nota visible de la profe', () => {
    expect(
      toWeeklyPractice(semana, [observacion], [actividad({ vocal: 'o' })]),
    ).toEqual({
      student: { id: '5', displayName: 'Estrella P.', initials: 'EP' },
      vowel: 'o',
      teacherNote: {
        text: 'Practiquen la a frente al espejo.',
        audioUri: null,
      },
      practicedToday: false,
      days: semana.dias.map((d) => ({
        date: d.fecha,
        practiced: d.practicado,
      })),
      feedback: [],
    });
    expect(toWeeklyPractice(semana, [], []).teacherNote).toBeNull();
  });
});

function setup(handler: FakeHandler) {
  const fake = createFakeFetch(handler);
  const api = createApiClient({
    baseUrl: BASE,
    getToken: () => Promise.resolve('jwt'),
    fetchFn: fake.fetchFn,
  });
  return { guardians: createHttpGuardianRepository(api), ...fake };
}

const handler: FakeHandler = ({ url }) => {
  const path = url.replace(BASE, '');
  if (path.startsWith('/estudiantes?')) {
    return jsonResponse(200, {
      items: [semana.estudiante],
      total: 1,
      page: 1,
      limit: 50,
    });
  }
  if (path.endsWith('/practica-semanal')) return jsonResponse(200, semana);
  if (path.includes('/observaciones')) {
    return jsonResponse(200, {
      items: [observacion],
      total: 1,
      page: 1,
      limit: 1,
    });
  }
  if (path.endsWith('/actividades')) return jsonResponse(200, [actividad({})]);
  if (path.endsWith('/practica-casa/hoy')) {
    return jsonResponse(200, { ...semana, practicadoHoy: true });
  }
  return jsonResponse(404, { message: 'no' });
};

describe('GuardianRepository (HTTP)', () => {
  it('sin niños vinculados lanza un error propio (no de conexión)', async () => {
    const { guardians, requests } = setup(({ url }) =>
      url.includes('/estudiantes?')
        ? jsonResponse(200, { items: [], total: 0, page: 1, limit: 50 })
        : jsonResponse(404, { message: 'no' }),
    );

    await expect(guardians.getWeeklyPractice('4')).rejects.toBeInstanceOf(
      NoLinkedStudentsError,
    );
    // No pide la práctica de nadie.
    expect(requests).toHaveLength(1);
  });

  it('sus estudiantes: GET /estudiantes (el backend devuelve solo los suyos)', async () => {
    const { guardians, requests } = setup(handler);

    await expect(guardians.listStudents('4')).resolves.toEqual([
      { id: '5', displayName: 'Estrella P.', initials: 'EP' },
    ]);
    expect(requests[0]?.url).toBe(`${BASE}/estudiantes?limit=50`);
  });

  it('sin elegir estudiante: usa el primero y pide las tres rutas', async () => {
    const { guardians, requests } = setup(handler);

    const week = await guardians.getWeeklyPractice('4');

    expect(week.vowel).toBe('a');
    expect(requests.map((r) => r.url).sort()).toEqual(
      [
        `${BASE}/estudiantes?limit=50`,
        `${BASE}/estudiantes/5/actividades`,
        `${BASE}/estudiantes/5/observaciones?limit=1`,
        `${BASE}/estudiantes/5/practica-semanal`,
      ].sort(),
    );
  });

  it('con un estudiante elegido no vuelve a pedir la lista', async () => {
    const { guardians, requests } = setup(handler);

    await guardians.getWeeklyPractice('4', '5');

    expect(requests.map((r) => r.url)).not.toContain(
      `${BASE}/estudiantes?limit=50`,
    );
  });

  it('«Lo practicamos hoy»: PUT /estudiantes/:id/practica-casa/hoy', async () => {
    const { guardians, requests } = setup(handler);

    await guardians.markPracticedToday('4', '5');

    expect(requests[0]).toMatchObject({
      url: `${BASE}/estudiantes/5/practica-casa/hoy`,
      method: 'PUT',
    });
  });

  it('sin estudiantes asociados, lo dice', async () => {
    const { guardians } = setup(() =>
      jsonResponse(200, { items: [], total: 0, page: 1, limit: 50 }),
    );

    await expect(guardians.getWeeklyPractice('4')).rejects.toThrow(
      'no tiene estudiantes',
    );
  });
});
