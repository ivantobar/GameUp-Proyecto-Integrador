import { createApiClient } from '@/services/api';
import { createFakeBackend, FAKE_API_URL } from '@/test-utils/fakeBackend';
import { InvalidCredentialsError } from '../authErrors';
import { createHttpRepositories } from '../http/createHttpRepositories';
import { createMemoryTokenStore } from '../http/tokenStore';
import { createMockRepositories } from '../mock/createMockRepositories';
import { MOCK_PASSWORD } from '../mock/fixtures';
import type { Repositories } from '../repositories';

/**
 * Sustitución de Liskov: la versión simulada y la HTTP cumplen el mismo
 * contrato. Las mismas pruebas corren contra las dos; si una se comporta
 * distinto (otro tipo, otro error), falla aquí y no en una pantalla.
 */

/** Espera una promesa avanzando el reloj simulado (los mocks usan setTimeout). */
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

const implementations: [string, () => Repositories][] = [
  ['simulada', () => createMockRepositories({ delayMs: 0 })],
  [
    'HTTP',
    () => {
      const tokens = createMemoryTokenStore();
      const api = createApiClient({
        baseUrl: FAKE_API_URL,
        getToken: tokens.get,
        fetchFn: createFakeBackend().fetchFn,
      });
      return createHttpRepositories(api, tokens);
    },
  ],
];

describe.each(implementations)('contrato de la versión %s', (_name, create) => {
  let repos: Repositories;
  const signInAs = (email: string) =>
    settle(repos.auth.signIn({ email, password: MOCK_PASSWORD }));

  beforeEach(() => {
    repos = create();
  });

  it.each([
    ['estudiante@gameup.test', 'student'],
    ['docente@gameup.test', 'teacher'],
    ['acudiente@gameup.test', 'guardian'],
    ['directora@gameup.test', 'director'],
  ])('%s entra con el rol %s', async (email, role) => {
    const session = await signInAs(email);

    expect(session.role).toBe(role);
    expect(typeof session.userId).toBe('string');
    expect(typeof session.displayName).toBe('string');
    expect(Object.keys(session).sort()).toEqual([
      'displayName',
      'role',
      'userId',
    ]);
  });

  it('una contraseña equivocada rechaza con InvalidCredentialsError', async () => {
    await expect(
      settle(
        repos.auth.signIn({ email: 'docente@gameup.test', password: 'mala' }),
      ),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('una cuenta que no existe rechaza con InvalidCredentialsError', async () => {
    await expect(
      settle(
        repos.auth.signIn({
          email: 'nadie@gameup.test',
          password: MOCK_PASSWORD,
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('el estudiante con sesión es un StudentProfile', async () => {
    const session = await signInAs('estudiante@gameup.test');

    const student = await settle(repos.students.getCurrentStudent());

    expect(student).toEqual({
      id: session.userId,
      displayName: expect.any(String),
    });
  });

  it('la docente y el acudiente con sesión son StaffProfile', async () => {
    const teacher = await signInAs('docente@gameup.test');
    expect(await settle(repos.staff.getCurrentTeacher())).toEqual({
      id: teacher.userId,
      displayName: teacher.displayName,
    });

    const guardian = await signInAs('acudiente@gameup.test');
    expect(await settle(repos.staff.getCurrentGuardian())).toEqual({
      id: guardian.userId,
      displayName: guardian.displayName,
    });
  });

  describe('flujo del estudiante', () => {
    beforeEach(async () => {
      await signInAs('estudiante@gameup.test');
    });

    it('práctica: las cinco vocales, con 0 a 3 estrellas', async () => {
      const practice = await settle(repos.practice.getVowelPractice('me'));

      expect(practice.map((p) => p.vowel)).toEqual(['a', 'e', 'i', 'o', 'u']);
      practice.forEach((p) => {
        expect(p.stars).toBeGreaterThanOrEqual(0);
        expect(p.stars).toBeLessThanOrEqual(3);
      });
    });

    it('tareas pendientes: cada una con su actividad para abrirla', async () => {
      const pending = await settle(
        repos.assignments.listPendingForStudent('me'),
      );

      expect(pending.length).toBeGreaterThan(0);
      pending.forEach((a) => {
        expect(typeof a.activityId).toBe('string');
        expect(typeof a.isNew).toBe('boolean');
      });
    });

    it('la actividad de Busca la boca trae sus vocales', async () => {
      const pending = await settle(
        repos.assignments.listPendingForStudent('me'),
      );
      const task = pending.find((a) => a.gameId === 'findMouth');
      if (!task?.activityId) throw new Error('Falta la tarea de Busca la boca');

      const activity = await settle(
        repos.activities.getActivity(task.activityId),
      );

      expect(activity).toMatchObject({ gameId: 'findMouth' });
      if (activity.gameId === 'findMouth') {
        expect(activity.vowels.length).toBeGreaterThan(0);
      }
    });

    it('progreso: módulos con id y nombre; lo pendiente va aparte', async () => {
      const progress = await settle(repos.progress.getOfficialProgress('me'));

      progress.modules.forEach((m) => {
        expect(typeof m.moduleId).toBe('string');
        expect(typeof m.title).toBe('string');
        expect(m.validated).toBeLessThanOrEqual(m.total);
      });
      expect(typeof progress.pendingValidation).toBe('number');
    });

    it('el consentimiento es un sí o un no', async () => {
      const consent = await settle(
        repos.consent.hasVoiceRecordingConsent('me'),
      );
      expect(typeof consent).toBe('boolean');
    });

    it('un juego abierto desde una actividad llega al docente', async () => {
      const result = await settle(
        repos.results.submitFindMouthResult({
          studentId: 'me',
          firstTryCorrect: 4,
          total: 5,
          activityId: 'act-demo-001',
        }),
      );
      const attempt = await settle(
        repos.recordings.submitSpeechAttempt({
          studentId: 'me',
          vowel: 'o',
          audioUri: null,
          activityId: 'act-demo-002',
        }),
      );

      expect(result).toMatchObject({
        status: 'pending_validation',
        sentForReview: true,
      });
      expect(attempt).toMatchObject({
        status: 'pending_validation',
        sentForReview: true,
        audioUri: null,
      });
    });
  });

  describe('juegos de «Pensar y recordar»', () => {
    beforeEach(async () => {
      await signInAs('estudiante@gameup.test');
    });

    it.each([
      ['act-demo-003', 'match'],
      ['act-demo-004', 'classify'],
      ['act-demo-005', 'sequence'],
      ['act-demo-006', 'memory'],
    ] as const)(
      'la actividad %s trae el contenido de %s',
      async (id, gameId) => {
        const content = await settle(repos.activities.getActivity(id));

        expect(content.gameId).toBe(gameId);
        const items =
          content.gameId === 'match'
            ? content.rounds
            : content.gameId === 'classify'
              ? content.sets
              : content.gameId === 'sequence'
                ? content.routines
                : content.gameId === 'memory'
                  ? content.boards
                  : [];
        expect(items.length).toBeGreaterThan(0);
      },
    );

    it('desde una tarea, el resultado llega al docente', async () => {
      const result = await settle(
        repos.results.submitGameResult({
          studentId: 'me',
          gameId: 'match',
          score: { kind: 'turns', firstTryCorrect: 2, total: 3 },
          activityId: 'act-demo-003',
        }),
      );

      expect(result).toMatchObject({
        gameId: 'match',
        status: 'pending_validation',
        sentForReview: true,
      });
    });

    it('en juego libre no se envía', async () => {
      const result = await settle(
        repos.results.submitGameResult({
          studentId: 'me',
          gameId: 'memory',
          score: { kind: 'memory', pairs: 3, mismatches: 0 },
        }),
      );

      expect(result.sentForReview).toBe(false);
    });
  });

  describe('revisión de la tallerista', () => {
    let teacherId: string;
    beforeEach(async () => {
      teacherId = (await signInAs('docente@gameup.test')).userId;
    });

    it('la bandeja trae intentos pendientes de sus estudiantes', async () => {
      const items = await settle(repos.reviews.listPendingReviews(teacherId));

      expect(items.length).toBeGreaterThan(0);
      items.forEach((item) => {
        expect(['speech', 'listening', 'game']).toContain(item.kind);
        expect(item.status).toBe('pending_validation');
        expect(typeof item.student.displayName).toBe('string');
      });
    });

    it('validar y pedir más práctica; sin indicación, rechaza', async () => {
      const [first, second] = await settle(
        repos.reviews.listPendingReviews(teacherId),
      );
      if (!first || !second) throw new Error('faltan pendientes');

      await expect(settle(repos.reviews.validate(first.id))).resolves.toBe(
        undefined,
      );
      await expect(
        settle(repos.reviews.requestMorePractice(second.id, '   ')),
      ).rejects.toThrow('obligatoria');
      await expect(
        settle(repos.reviews.requestMorePractice(second.id, 'Otra vez.')),
      ).resolves.toBe(undefined);
    });

    it('la nota para la familia se guarda', async () => {
      await expect(
        settle(
          repos.reviews.shareNoteWithFamily('est-demo-001', 'Practiquen la a.'),
        ),
      ).resolves.toBe(undefined);
    });
  });

  describe('espacio del acudiente', () => {
    let guardianId: string;
    beforeEach(async () => {
      guardianId = (await signInAs('acudiente@gameup.test')).userId;
    });

    it('ve a su estudiante y su semana', async () => {
      const students = await settle(repos.guardians.listStudents(guardianId));
      const week = await settle(repos.guardians.getWeeklyPractice(guardianId));

      expect(students.map((s) => s.id)).toContain(week.student.id);
      expect(typeof week.practicedToday).toBe('boolean');
      expect(week.vowel === null || typeof week.vowel === 'string').toBe(true);
    });

    it('«Lo practicamos hoy» queda registrado', async () => {
      const before = await settle(
        repos.guardians.getWeeklyPractice(guardianId),
      );
      await settle(
        repos.guardians.markPracticedToday(guardianId, before.student.id),
      );
      const after = await settle(repos.guardians.getWeeklyPractice(guardianId));

      expect(after.practicedToday).toBe(true);
    });

    it('no puede ver a otro estudiante', async () => {
      await expect(
        settle(repos.guardians.getWeeklyPractice(guardianId, 'est-demo-002')),
      ).rejects.toThrow();
    });

    it('cerrar sesión no falla', async () => {
      await expect(settle(repos.auth.signOut())).resolves.toBeUndefined();
    });
  });
});
