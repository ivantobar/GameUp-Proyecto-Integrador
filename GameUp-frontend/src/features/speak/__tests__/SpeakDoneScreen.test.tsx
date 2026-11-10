import { act, render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import DoneStep from '@/app/student/speak/[vowel]/done';
import type { VoiceConsentStatus } from '@/data/types';
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

async function renderDone(status: VoiceConsentStatus) {
  jest.mocked(usePracticeSession).mockReturnValue({
    outcome: outcomeWith(status),
    setOutcome: jest.fn(),
  });
  await render(<DoneStep />);
  await act(async () => {
    await jest.runAllTimersAsync();
  });
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
