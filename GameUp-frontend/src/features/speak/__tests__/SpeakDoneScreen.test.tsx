import { act, render, screen } from '@testing-library/react-native';
import DoneStep from '@/app/student/speak/[vowel]/done';
import type { VoiceConsentStatus } from '@/data/types';
import type { PracticeOutcome } from '../completePractice';
import { usePracticeSession } from '../PracticeSession';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), back: jest.fn(), navigate: jest.fn() },
  useLocalSearchParams: () => ({ vowel: 'a' }),
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
