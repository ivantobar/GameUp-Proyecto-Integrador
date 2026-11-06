import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { devSettings } from '@/data/mock/devSettings';
import { completePractice } from '../completePractice';

/** Los repositorios simulados responden con setTimeout: se avanza el reloj. */
async function run<T>(promise: Promise<T>): Promise<T> {
  await jest.runAllTimersAsync();
  return promise;
}

describe('completePractice (ciclo Mira → Dilo → Listo)', () => {
  it('con autorización: guarda la voz y deja el intento pendiente de validación', async () => {
    const repositories = createMockRepositories({
      delayMs: 0,
      voiceConsent: () => true,
    });
    const outcome = await run(
      completePractice(repositories, 'o', 'file:///cache/voz.m4a'),
    );

    expect(outcome.voiceConsent).toBe(true);
    expect(outcome.attempt.audioUri).toBe('file:///cache/voz.m4a');
    // La app no califica: el intento espera al docente.
    expect(outcome.attempt.status).toBe('pending_validation');
    expect(outcome.studentName).toBe('Martín');
  });

  it('sin autorización: no se guarda ninguna voz', async () => {
    const repositories = createMockRepositories({
      delayMs: 0,
      voiceConsent: () => false,
    });
    const outcome = await run(
      completePractice(repositories, 'o', 'file:///cache/voz.m4a'),
    );

    expect(outcome.voiceConsent).toBe(false);
    expect(outcome.attempt.audioUri).toBeNull();
  });

  it('suma 1 estrella de práctica por ciclo, hasta 3', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    // La O empieza con 1 estrella en los datos simulados.
    const first = await run(completePractice(repositories, 'o', null));
    const second = await run(completePractice(repositories, 'o', null));
    const third = await run(completePractice(repositories, 'o', null));

    expect([first.stars, second.stars, third.stars]).toEqual([2, 3, 3]);
  });

  it('actualiza «Sigue donde ibas» con la vocal practicada', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    await run(completePractice(repositories, 'u', null));
    const resume = await run(
      repositories.practice.getResumePoint('est-demo-001'),
    );
    expect(resume).toEqual({ gameId: 'speak', vowel: 'u' });
  });
});

describe('consentimiento simulado de «Modo desarrollo»', () => {
  it('los repositorios leen el ajuste en cada intento', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });

    devSettings.set({ voiceConsent: false });
    const without = await run(
      completePractice(repositories, 'a', 'file:///x.m4a'),
    );
    devSettings.set({ voiceConsent: true });
    const withConsent = await run(
      completePractice(repositories, 'a', 'file:///x.m4a'),
    );

    expect(without.attempt.audioUri).toBeNull();
    expect(withConsent.attempt.audioUri).toBe('file:///x.m4a');
  });
});

describe('completePractice con actividad (fase 2a)', () => {
  it('desde una tarea: el intento llega al docente', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    const outcome = await run(
      completePractice(repositories, 'o', null, 'act-demo-002'),
    );

    expect(outcome.delivery).toBe('review');
    expect(outcome.attempt.sentForReview).toBe(true);
  });

  it('práctica libre con la API: no se envía y «Listo» no habla de la profe', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    repositories.recordings.submitSpeechAttempt = (input) =>
      Promise.resolve({
        id: 'local',
        ...input,
        status: 'submitted',
        createdAt: '2026-11-05T15:00:00.000Z',
        sentForReview: false,
      });

    const outcome = await run(completePractice(repositories, 'e', null));

    expect(outcome.delivery).toBe('practice');
  });

  it('Regla 11: si el envío falla, se celebra igual y se avisa al adulto', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    repositories.recordings.submitSpeechAttempt = () =>
      Promise.reject(new Error('sin red'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const outcome = await run(
      completePractice(repositories, 'a', 'file:///voz.m4a', 'act-demo-002'),
    );

    expect(outcome.delivery).toBe('notSent');
    // El niño puede oír lo que dijo en «Listo», aunque no se haya enviado.
    expect(outcome.attempt.audioUri).toBe('file:///voz.m4a');
    expect(warn).toHaveBeenCalledWith(
      '[GameUP] No se pudo enviar el intento de voz',
      'Error',
    );
    warn.mockRestore();
  });
});
