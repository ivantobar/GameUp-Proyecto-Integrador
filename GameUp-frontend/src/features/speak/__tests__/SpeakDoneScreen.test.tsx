import { act, render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import DoneStep from '@/app/student/speak/[vowel]/done';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import type { Repositories } from '@/data/repositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { SpeechAttempt, VoiceConsentStatus } from '@/data/types';
import { createRecording, mockFiles } from '@/test-utils/mockFiles';
import type { PracticeOutcome } from '../completePractice';
import { usePracticeSession } from '../PracticeSession';

const mockParams: { vowel: string; actividadId?: string } = { vowel: 'a' };
const mockParent = { canGoBack: jest.fn(() => true), goBack: jest.fn() };
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
    dismissTo: jest.fn(),
  },
  useLocalSearchParams: () => mockParams,
  useNavigation: () => ({ getParent: () => mockParent }),
}));
jest.mock('../PracticeSession', () => ({
  usePracticeSession: jest.fn(),
}));

/** Resultado de Dilo con datos inventados; solo cambia el consentimiento. */
function outcomeWith(status: VoiceConsentStatus): PracticeOutcome {
  return {
    vowel: 'a',
    studentName: 'Lunita',
    stars: 1,
    attempt: {
      id: 'int-prueba-1',
      studentId: 'est-prueba-1',
      vowel: 'a',
      audioUri: status === 'granted' ? 'file:///prueba.m4a' : null,
      status: 'pending_validation',
      createdAt: '2026-11-05T15:00:00.000Z',
      sentForReview: true,
    },
    voiceConsent: status === 'granted',
    voiceConsentStatus: status,
    delivery: 'review',
  };
}

async function renderDone(
  status: VoiceConsentStatus,
  outcome: PracticeOutcome = outcomeWith(status),
  repositories: Repositories = createMockRepositories({ delayMs: 0 }),
) {
  jest.mocked(usePracticeSession).mockReturnValue({
    outcome,
    setOutcome: jest.fn(),
  });
  const view = await render(
    <RepositoryProvider repositories={repositories}>
      <DoneStep />
    </RepositoryProvider>,
  );
  await act(async () => {
    await jest.runAllTimersAsync();
  });
  return view;
}

const NO_AUTH =
  'Tu voz no se grabó porque no hay autorización de tu acudiente.';
const NOT_VERIFIED =
  'Hoy no pudimos guardar tu voz. ¡Igual lo hiciste muy bien!';

describe('«Listo» de Habla conmigo cuando la voz no se grabó', () => {
  it('NO_ACEPTADO: dice que falta la autorización del acudiente', async () => {
    await renderDone('notGranted');

    expect(screen.getByText('¡Muy bien, Lunita!')).toBeOnTheScreen();
    expect(screen.getByText(NO_AUTH)).toBeOnTheScreen();
    expect(screen.queryByText(NOT_VERIFIED)).toBeNull();
  });

  it('NO_VERIFICABLE o sin respuesta clara: no culpa al acudiente', async () => {
    await renderDone('notVerified');

    // Se celebra siempre.
    expect(screen.getByText('¡Muy bien, Lunita!')).toBeOnTheScreen();
    expect(screen.getByText(NOT_VERIFIED)).toBeOnTheScreen();
    expect(screen.queryByText(NO_AUTH)).toBeNull();
  });

  it('con autorización no muestra ningún aviso de voz', async () => {
    await renderDone('granted');

    expect(screen.getByText('¡Muy bien, Lunita!')).toBeOnTheScreen();
    expect(screen.queryByText(NO_AUTH)).toBeNull();
    expect(screen.queryByText(NOT_VERIFIED)).toBeNull();
  });
});

describe('«Listo» de Habla conmigo según de dónde viene', () => {
  afterEach(() => {
    delete mockParams.actividadId;
    jest.clearAllMocks();
  });

  it('desde una tarea: «Volver a mis tareas» sale de Habla conmigo', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockParams.actividadId = '8';
    await renderDone('granted');

    await user.press(
      screen.getByRole('button', { name: 'Volver a mis tareas' }),
    );
    expect(mockParent.goBack).toHaveBeenCalledTimes(1);
    expect(router.dismissTo).not.toHaveBeenCalled();
    // «Otro sonido» sigue ahí.
    expect(
      screen.getByRole('button', { name: 'Otro sonido' }),
    ).toBeOnTheScreen();
  });

  it('desde una tarea, sin a dónde volver: abre «Tareas de mi profe»', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockParams.actividadId = '8';
    mockParent.canGoBack.mockReturnValueOnce(false);
    await renderDone('granted');

    await user.press(
      screen.getByRole('button', { name: 'Volver a mis tareas' }),
    );
    expect(router.navigate).toHaveBeenCalledWith('/student/tasks');
  });

  it('en práctica libre no hay «Volver a mis tareas»', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderDone('granted');

    expect(
      screen.queryByRole('button', { name: 'Volver a mis tareas' }),
    ).toBeNull();
    await user.press(screen.getByRole('button', { name: 'Otro sonido' }));
    expect(router.dismissTo).toHaveBeenCalledWith('/student/speak');
  });
});

/** Resultado desde una tarea, con una grabación real en la caché simulada. */
function taskOutcome(delivery: PracticeOutcome['delivery']): PracticeOutcome {
  const base = outcomeWith('granted');
  return {
    ...base,
    attempt: { ...base.attempt, audioUri: createRecording() },
    delivery,
  };
}

describe('«Listo»: la voz se borra del teléfono al salir (Ley 1581)', () => {
  afterEach(() => {
    delete mockParams.actividadId;
    mockFiles().clear();
  });

  it('mientras está en «Listo» la grabación sigue (para oírse)', async () => {
    mockParams.actividadId = '8';
    const outcome = taskOutcome('review');
    await renderDone('granted', outcome);

    expect(mockFiles().has(outcome.attempt.audioUri!)).toBe(true);
    expect(
      screen.getByRole('button', { name: 'Escuchar: Así lo dijiste tú' }),
    ).toBeOnTheScreen();
  });

  it('al salir de «Listo» la grabación se borra, aunque se haya enviado', async () => {
    mockParams.actividadId = '8';
    const outcome = taskOutcome('review');
    const view = await renderDone('granted', outcome);

    await view.unmount();

    expect(mockFiles().has(outcome.attempt.audioUri!)).toBe(false);
  });

  it('si no se envió, también se borra al salir', async () => {
    mockParams.actividadId = '8';
    const outcome = taskOutcome('notSent');
    const view = await renderDone('granted', outcome);

    await view.unmount();

    expect(mockFiles().has(outcome.attempt.audioUri!)).toBe(false);
  });
});

describe('«Listo»: «Reintentar envío» para el adulto', () => {
  afterEach(() => {
    delete mockParams.actividadId;
    mockFiles().clear();
  });

  const NOT_SENT =
    'Para el adulto: no pudimos enviar la voz a la profe. Revisen la conexión y toquen «Reintentar envío».';
  const FAILED =
    'Para el adulto: todavía no se pudo enviar. Revisen la conexión e inténtenlo otra vez.';
  const SENT = 'Listo: la voz ya le llegó a la profe.';

  it('si llegó a la profe, no hay botón de reintento', async () => {
    mockParams.actividadId = '8';
    await renderDone('granted', taskOutcome('review'));

    expect(
      screen.queryByRole('button', { name: 'Reintentar envío' }),
    ).toBeNull();
  });

  it('si no llegó, reintenta con la misma voz y avisa que llegó', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockParams.actividadId = '8';
    const outcome = taskOutcome('notSent');
    const repositories = createMockRepositories({ delayMs: 0 });
    const submit = jest
      .spyOn(repositories.recordings, 'submitSpeechAttempt')
      .mockResolvedValue({
        ...outcome.attempt,
        sentForReview: true,
      } satisfies SpeechAttempt);
    await renderDone('granted', outcome, repositories);

    expect(screen.getByText(NOT_SENT)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Reintentar envío' }));

    expect(submit).toHaveBeenCalledWith({
      studentId: 'est-prueba-1',
      vowel: 'a',
      audioUri: outcome.attempt.audioUri,
      activityId: '8',
    });
    expect(await screen.findByText(SENT)).toBeOnTheScreen();
    expect(
      screen.queryByRole('button', { name: 'Reintentar envío' }),
    ).toBeNull();
    // Ya llegó: se habla de la profe.
    expect(
      screen.getByText(
        'Tu profe lo va a escuchar antes de sumarlo a tu progreso',
      ),
    ).toBeOnTheScreen();
  });

  it('si el reintento falla, lo dice y deja reintentar otra vez', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockParams.actividadId = '8';
    const repositories = createMockRepositories({ delayMs: 0 });
    repositories.recordings.submitSpeechAttempt = () =>
      Promise.reject(new Error('sin red'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await renderDone('granted', taskOutcome('notSent'), repositories);

    await user.press(screen.getByRole('button', { name: 'Reintentar envío' }));

    expect(await screen.findByText(FAILED)).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Reintentar envío' }),
    ).toBeOnTheScreen();
    // Sin datos del niño en el registro.
    expect(warn).toHaveBeenCalledWith(
      '[GameUP] No se pudo reenviar el intento de voz',
      'Error',
    );
    warn.mockRestore();
  });
});
