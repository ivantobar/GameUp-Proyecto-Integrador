import type { Repositories } from '../../repositories';
import { createMockRepositories } from '../createMockRepositories';
import { mockGuardian, mockStudent, mockTeacher } from '../fixtures';

/** Espera una promesa avanzando el reloj simulado (los mocks usan setTimeout). */
async function run<T>(promise: Promise<T>): Promise<T> {
  const outcome = promise.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  );
  await jest.runAllTimersAsync();
  const result = await outcome;
  if (result.ok) return result.value;
  throw result.error;
}

/** Repositorios simulados cuyas llamadas avanzan el reloj solas. */
function instant(options: Parameters<typeof createMockRepositories>[0] = {}) {
  const repos = createMockRepositories({ delayMs: 0, ...options });
  return new Proxy(repos, {
    get(target, key: keyof Repositories) {
      const group = target[key] as unknown as Record<
        string,
        (...args: unknown[]) => Promise<unknown>
      >;
      return new Proxy(group, {
        get(inner, method: string) {
          const fn = inner[method];
          return fn ? (...args: unknown[]) => run(fn(...args)) : undefined;
        },
      });
    },
  });
}

const lettersOf = async (repos: Repositories): Promise<number> => {
  const progress = await repos.progress.getOfficialProgress(mockStudent.id);
  return progress.modules.find((m) => m.moduleId === 'letters')?.validated ?? 0;
};

/**
 * Ciclo realización → validación → progreso con los datos simulados, y los
 * límites de acceso de cada rol (reglas de negocio 1 a 6).
 */
describe('ciclo de revisión (datos simulados)', () => {
  it('el docente ve las 3 actividades de ejemplo de sus estudiantes', async () => {
    const repos = instant();
    const items = await repos.reviews.listPendingReviews(mockTeacher.id);
    expect(items.map((i) => i.student.displayName)).toEqual([
      'Martín C.',
      'Valentina G.',
      'Samuel O.',
    ]);
    expect(items.map((i) => i.kind)).toEqual(['speech', 'speech', 'listening']);
  });

  it('un docente sin estudiantes asignados no ve nada', async () => {
    const repos = instant();
    expect(await repos.reviews.listPendingReviews('doc-otro')).toEqual([]);
  });

  it('el intento del estudiante llega a «Por escuchar» como intento 2 de 2', async () => {
    const repos = instant({ voiceConsent: () => true });
    await repos.recordings.submitSpeechAttempt({
      studentId: mockStudent.id,
      vowel: 'o',
      audioUri: 'file:///cache/intento.m4a',
    });
    const items = await repos.reviews.listPendingReviews(mockTeacher.id);
    const martin = items.filter((i) => i.student.id === mockStudent.id);
    expect(martin).toHaveLength(2);
    expect(martin[0]?.speech).toMatchObject({
      audioUri: 'file:///cache/intento.m4a',
      attemptNumber: 2,
      attemptsTotal: 2,
    });
    expect(martin[1]?.speech?.attemptsTotal).toBe(2);
  });

  it('sin autorización del acudiente no se guarda la voz', async () => {
    const repos = instant({ voiceConsent: () => false });
    await repos.recordings.submitSpeechAttempt({
      studentId: mockStudent.id,
      vowel: 'e',
      audioUri: 'file:///cache/no-deberia.m4a',
    });
    const [latest] = await repos.reviews.listPendingReviews(mockTeacher.id);
    expect(latest?.speech).toMatchObject({
      vowel: 'e',
      audioUri: null,
      voiceConsent: false,
    });
  });

  it('lo pendiente no suma; al validar sale de la lista y sube el progreso', async () => {
    const repos = instant();
    const before = await lettersOf(repos);
    const pending = await repos.progress.getOfficialProgress(mockStudent.id);
    expect(pending.pendingValidation).toBe(1);

    await repos.reviews.validate('rev-demo-001');

    const items = await repos.reviews.listPendingReviews(mockTeacher.id);
    expect(items.map((i) => i.id)).not.toContain('rev-demo-001');
    expect(await lettersOf(repos)).toBe(before + 1);
    const after = await repos.progress.getOfficialProgress(mockStudent.id);
    expect(after.pendingValidation).toBe(0);
  });

  it('«Practicar más» exige retroalimentación y no suma al progreso', async () => {
    const repos = instant();
    const before = await lettersOf(repos);

    await expect(
      repos.reviews.requestMorePractice('rev-demo-001', '   '),
    ).rejects.toThrow('obligatoria');

    await repos.reviews.requestMorePractice(
      'rev-demo-001',
      'Hazlo más despacio, abriendo bien la boca.',
    );
    const items = await repos.reviews.listPendingReviews(mockTeacher.id);
    expect(items.map((i) => i.id)).not.toContain('rev-demo-001');
    expect(await lettersOf(repos)).toBe(before);

    const week = await repos.guardians.getWeeklyPractice(mockGuardian.id);
    expect(week.teacherNote?.text).toBe(
      'Hazlo más despacio, abriendo bien la boca.',
    );
  });

  it('la nota de voz del docente llega a la familia', async () => {
    const repos = instant();
    await repos.reviews.saveFamilyVoiceNote(
      mockStudent.id,
      'file:///cache/nota.m4a',
    );
    const week = await repos.guardians.getWeeklyPractice(mockGuardian.id);
    expect(week.teacherNote?.audioUri).toBe('file:///cache/nota.m4a');
  });
});

describe('espacio del acudiente (datos simulados)', () => {
  it('solo ve a su estudiante asociado y el sonido de la semana', async () => {
    const repos = instant();
    const week = await repos.guardians.getWeeklyPractice(mockGuardian.id);
    expect(week.student.id).toBe(mockStudent.id);
    expect(week.vowel).toBe('o');
    expect(week.practicedToday).toBe(false);
  });

  it('un acudiente sin estudiantes asociados no recibe datos', async () => {
    const repos = instant();
    await expect(repos.guardians.getWeeklyPractice('acu-otro')).rejects.toThrow(
      'no tiene estudiantes',
    );
  });

  it('«Lo practicamos hoy» queda registrado solo para su estudiante', async () => {
    const repos = instant();
    await expect(
      repos.guardians.markPracticedToday(mockGuardian.id, 'est-demo-002'),
    ).rejects.toThrow('asociado');

    await repos.guardians.markPracticedToday(mockGuardian.id, mockStudent.id);
    const week = await repos.guardians.getWeeklyPractice(mockGuardian.id);
    expect(week.practicedToday).toBe(true);
  });
});
