import { createApiClient } from '@/services/api';
import { createFakeBackend, FAKE_API_URL } from '@/test-utils/fakeBackend';
import { InvalidCredentialsError } from '../authErrors';
import { createHttpRepositories } from '../http/createHttpRepositories';
import { createMemoryTokenStore } from '../http/tokenStore';
import { createMockRepositories } from '../mock/createMockRepositories';
import { MOCK_PASSWORD, mockStudent } from '../mock/fixtures';
import type { Repositories } from '../repositories';
import {
  AssignmentError,
  StudentAccessError,
  TeacherLinkError,
} from '../studentErrors';

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

    it('el motivo del consentimiento es uno de tres', async () => {
      const status = await settle(repos.consent.getVoiceConsentStatus('me'));
      expect(['granted', 'notGranted', 'notVerified']).toContain(status);
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

  describe('escalera de niveles por juego', () => {
    beforeEach(async () => {
      await signInAs('estudiante@gameup.test');
    });

    it('el estudiante empieza en el nivel 1 de los 4 juegos', async () => {
      const levels = await settle(repos.levels.getMyLevels());

      expect(levels.map((l) => [l.gameId, l.level, l.completed])).toEqual([
        ['match', 1, false],
        ['classify', 1, false],
        ['sequence', 1, false],
        ['memory', 1, false],
      ]);
    });

    it('abre su nivel actual: Memoria nivel 1 tiene 2 parejas', async () => {
      const { level, content } = await settle(
        repos.levels.getCurrentLevelActivity('memory'),
      );

      expect(level).toMatchObject({ gameId: 'memory', level: 1 });
      if (content.gameId !== 'memory') throw new Error('no es Memoria');
      expect(content.boards[0]?.pairs).toHaveLength(2);
      expect(content.activityId).toBeTruthy();
    });

    it('aprobar el nivel actual lo sube 1 → 2 solo en ese juego', async () => {
      const student = await settle(repos.students.getCurrentStudent());
      const { content } = await settle(
        repos.levels.getCurrentLevelActivity('memory'),
      );
      const result = await settle(
        repos.results.submitGameResult({
          studentId: student.id,
          gameId: 'memory',
          score: { kind: 'memory', pairs: 2, mismatches: 1 },
          activityId: content.activityId,
        }),
      );
      expect(result.sentForReview).toBe(true);

      await signInAs('docente@gameup.test');
      await expect(settle(repos.reviews.validate(result.id))).resolves.toEqual({
        gameId: 'memory',
        previousLevel: 1,
        level: 2,
        completed: false,
      });

      await signInAs('estudiante@gameup.test');
      const levels = await settle(repos.levels.getMyLevels());
      expect(levels.find((l) => l.gameId === 'memory')?.level).toBe(2);
      expect(levels.find((l) => l.gameId === 'match')?.level).toBe(1);
      const next = await settle(repos.levels.getCurrentLevelActivity('memory'));
      if (next.content.gameId !== 'memory') throw new Error('no es Memoria');
      expect(next.content.boards[0]?.pairs).toHaveLength(3);

      // El nivel 1 ya no se acepta.
      await expect(
        settle(
          repos.results.submitGameResult({
            studentId: student.id,
            gameId: 'memory',
            score: { kind: 'memory', pairs: 2, mismatches: 0 },
            activityId: content.activityId,
          }),
        ),
      ).rejects.toThrow();
    });

    it('la profe ve el nivel de cada juego de su estudiante', async () => {
      const student = await settle(repos.students.getCurrentStudent());
      await signInAs('docente@gameup.test');
      const levels = await settle(repos.levels.getStudentLevels(student.id));

      expect(levels).toHaveLength(4);
      expect(levels.every((l) => l.level === 1)).toBe(true);
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

    it('el resumen cuenta por estudiante lo mismo que su bandeja', async () => {
      const summary = await settle(repos.reviews.listPendingSummary(teacherId));

      expect(summary.length).toBeGreaterThan(0);
      for (const row of summary) {
        const items = await settle(
          repos.reviews.listPendingReviews(teacherId, row.student.id),
        );
        expect(items).toHaveLength(row.pending);
        expect(items.every((i) => i.student.id === row.student.id)).toBe(true);
        expect(typeof row.student.initials).toBe('string');
        expect(Number.isNaN(Date.parse(row.oldestAt))).toBe(false);
      }
    });

    it('validar y pedir más práctica; sin indicación, rechaza', async () => {
      const [first, second] = await settle(
        repos.reviews.listPendingReviews(teacherId),
      );
      if (!first || !second) throw new Error('faltan pendientes');

      // Una tarea de un módulo: no hay subida de nivel.
      await expect(
        settle(repos.reviews.validate(first.id)),
      ).resolves.toBeNull();
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

    it('no puede asignar actividades (notAllowed)', async () => {
      const error = await settle(
        repos.assignmentManagement.assign({
          moduleId: 'routines',
          studentId: 'est-demo-001',
        }),
      ).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(AssignmentError);
      expect((error as AssignmentError).problem).toBe('notAllowed');
    });
  });

  describe('espacio de la directora', () => {
    beforeEach(async () => {
      await signInAs('directora@gameup.test');
    });

    it('la sesión es un StaffProfile, aunque no sea docente', async () => {
      const staff = await settle(repos.staff.getCurrentStaff());
      expect(Object.keys(staff).sort()).toEqual(['displayName', 'id']);
    });

    it('ve más estudiantes que la docente (Lucía no es de la docente)', async () => {
      const students = await settle(repos.directory.listStudents());
      expect(students.map((s) => s.id)).toContain('est-demo-004');
    });

    it('el resumen son números enteros', async () => {
      const counts = await Promise.all([
        settle(repos.overview.countStudents()),
        settle(repos.overview.countPendingReviews()),
        settle(repos.overview.countAssignments('assigned')),
        settle(repos.overview.countAssignments('inProgress')),
        settle(repos.overview.countAssignments('completed')),
      ]);
      counts.forEach((n) => {
        expect(Number.isInteger(n)).toBe(true);
        expect(n).toBeGreaterThanOrEqual(0);
      });
      expect(counts[0]).toBe(4);
    });

    it('puede asignar a una estudiante que no es de la docente', async () => {
      const created = await settle(
        repos.assignmentManagement.assign({
          moduleId: 'routines',
          studentId: 'est-demo-004',
        }),
      );
      expect(created.state).toBe('assigned');
    });
  });

  describe('actividades de un módulo (antes de asignar)', () => {
    it('la tallerista ve las activas, en orden y con su juego', async () => {
      await signInAs('docente@gameup.test');
      const activities = await settle(
        repos.assignmentManagement.listModuleActivities('letters'),
      );

      // Letras tiene 10 activas; la retirada (inactiva) no aparece.
      expect(activities).toHaveLength(10);
      expect(activities[0]).toEqual({
        id: 'act-letters-1',
        title: 'Di la a',
        gameId: 'speak',
      });
      expect(activities[5]?.gameId).toBe('findMouth');
      expect(activities.some((a) => a.title === 'Actividad retirada')).toBe(
        false,
      );
    });

    it('un módulo que no existe → notFound', async () => {
      await signInAs('docente@gameup.test');
      await expect(
        settle(repos.assignmentManagement.listModuleActivities('no-existe')),
      ).rejects.toEqual(new AssignmentError('notFound'));
    });

    it('un borrador: la tallerista no lo ve; la directora sí', async () => {
      await signInAs('docente@gameup.test');
      await expect(
        settle(
          repos.assignmentManagement.listModuleActivities('draft-syllables'),
        ),
      ).rejects.toEqual(new AssignmentError('notFound'));

      await signInAs('directora@gameup.test');
      await expect(
        settle(
          repos.assignmentManagement.listModuleActivities('draft-syllables'),
        ),
      ).resolves.toEqual([]);
    });
  });

  describe('talleristas a cargo (directora)', () => {
    beforeEach(async () => {
      await signInAs('directora@gameup.test');
    });

    it('cada tallerista del estudiante es un StudentTeacher', async () => {
      const teachers = await settle(
        repos.teacherLinks.listStudentTeachers(mockStudent.id),
      );
      expect(teachers.length).toBeGreaterThan(0);
      teachers.forEach((t) => {
        expect(Object.keys(t).sort()).toEqual([
          'active',
          'displayName',
          'since',
          'teacherId',
        ]);
        expect(t.since).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('las activas para elegir son StaffProfile (sin Rosa, inactiva)', async () => {
      const teachers = await settle(repos.teacherLinks.listActiveTeachers());
      expect(teachers.map((t) => t.id)).toEqual([
        'doc-demo-001',
        'doc-demo-002',
        'doc-demo-003',
      ]);
      teachers.forEach((t) => {
        expect(Object.keys(t).sort()).toEqual(['displayName', 'id']);
      });
    });

    it('asignar, repetir (alreadyInCharge) y quitar (queda en el historial)', async () => {
      const created = await settle(
        repos.teacherLinks.assignTeacher('est-demo-004', 'doc-demo-002'),
      );
      expect(created).toMatchObject({
        teacherId: 'doc-demo-002',
        active: true,
      });

      const again = await settle(
        repos.teacherLinks
          .assignTeacher('est-demo-004', 'doc-demo-002')
          .catch((e: unknown) => e),
      );
      expect(again).toBeInstanceOf(TeacherLinkError);
      expect((again as TeacherLinkError).problem).toBe('alreadyInCharge');

      expect(
        await settle(
          repos.teacherLinks.removeTeacher('est-demo-004', 'doc-demo-002'),
        ),
      ).toBe('removed');
      const list = await settle(
        repos.teacherLinks.listStudentTeachers('est-demo-004'),
      );
      expect(list.filter((t) => t.active)).toEqual([]);
      expect(list.map((t) => t.teacherId).sort()).toEqual([
        'doc-demo-002',
        'doc-demo-003',
      ]);
    });

    it('reasignar a quien lo tuvo antes lo reactiva (sin duplicarlo)', async () => {
      await settle(
        repos.teacherLinks.assignTeacher('est-demo-004', 'doc-demo-003'),
      );
      const list = await settle(
        repos.teacherLinks.listStudentTeachers('est-demo-004'),
      );
      expect(list).toEqual([
        expect.objectContaining({ teacherId: 'doc-demo-003', active: true }),
      ]);
    });

    it('una cuenta que no es de tallerista activa → notActiveTeacher', async () => {
      const error = await settle(
        repos.teacherLinks
          .assignTeacher('est-demo-004', 'doc-demo-009')
          .catch((e: unknown) => e),
      );
      expect(error).toBeInstanceOf(TeacherLinkError);
      expect((error as TeacherLinkError).problem).toBe('notActiveTeacher');
    });

    it('quitar a quien ya no lo tenía a cargo → notInCharge (sin error)', async () => {
      expect(
        await settle(
          repos.teacherLinks.removeTeacher('est-demo-004', 'doc-demo-003'),
        ),
      ).toBe('notInCharge');
    });

    it('al quitarla, la tallerista deja de ver al estudiante', async () => {
      await settle(
        repos.teacherLinks.removeTeacher('est-demo-002', 'doc-demo-001'),
      );

      await signInAs('docente@gameup.test');
      await expect(
        settle(repos.directory.getStudent('est-demo-002')),
      ).rejects.toBeInstanceOf(StudentAccessError);
      const students = await settle(repos.directory.listStudents());
      expect(students.map((s) => s.id)).not.toContain('est-demo-002');
    });

    it('el docente no puede: StudentAccessError', async () => {
      await signInAs('docente@gameup.test');
      await expect(
        settle(repos.teacherLinks.listStudentTeachers(mockStudent.id)),
      ).rejects.toBeInstanceOf(StudentAccessError);
      await expect(
        settle(
          repos.teacherLinks.assignTeacher(mockStudent.id, 'doc-demo-002'),
        ),
      ).rejects.toBeInstanceOf(StudentAccessError);
    });
  });

  describe('asignaciones de la tallerista', () => {
    beforeEach(async () => {
      await signInAs('docente@gameup.test');
    });

    const problemOf = (promise: Promise<unknown>) =>
      settle(promise).then(
        () => 'sin error',
        (e: unknown) => (e instanceof AssignmentError ? e.problem : e),
      );

    it('ve a sus estudiantes con su progreso oficial', async () => {
      const students = await settle(repos.directory.listStudents());
      expect(students.length).toBeGreaterThan(0);
      const first = students[0]!;
      expect(Object.keys(first).sort()).toEqual([
        'displayName',
        'id',
        'initials',
      ]);
      const progress = await settle(
        repos.directory.getStudentProgress(first.id),
      );
      expect(Array.isArray(progress.modules)).toBe(true);
    });

    it('solo se ofrecen módulos publicados', async () => {
      const modules = await settle(
        repos.assignmentManagement.listAssignableModules(),
      );
      expect(modules.map((m) => m.id)).toContain('routines');
      expect(modules.map((m) => m.id)).not.toContain('draft-syllables');
    });

    it('asignar, repetir (alreadyAssigned) y quitar sin intentos', async () => {
      const created = await settle(
        repos.assignmentManagement.assign({
          moduleId: 'routines',
          studentId: 'est-demo-003',
        }),
      );
      expect(created).toMatchObject({
        moduleId: 'routines',
        moduleTitle: 'Rutinas de la casa',
        state: 'assigned',
        progress: 0,
        suggestedDate: null,
      });
      expect(
        await problemOf(
          repos.assignmentManagement.assign({
            moduleId: 'routines',
            studentId: 'est-demo-003',
          }),
        ),
      ).toBe('alreadyAssigned');

      await settle(repos.assignmentManagement.remove(created.id));
      const list = await settle(
        repos.assignmentManagement.listForStudent('est-demo-003'),
      );
      expect(list).toEqual([]);
    });

    it('un módulo sin publicar → notAssignable', async () => {
      expect(
        await problemOf(
          repos.assignmentManagement.assign({
            moduleId: 'draft-syllables',
            studentId: 'est-demo-003',
          }),
        ),
      ).toBe('notAssignable');
    });

    it('quitar una que ya empezó → hasAttempts', async () => {
      expect(
        await problemOf(repos.assignmentManagement.remove('asig-demo-001')),
      ).toBe('hasAttempts');
    });

    it('un estudiante ajeno → StudentAccessError', async () => {
      await expect(
        settle(repos.directory.getStudent('est-ajeno')),
      ).rejects.toBeInstanceOf(StudentAccessError);
    });
  });
});
