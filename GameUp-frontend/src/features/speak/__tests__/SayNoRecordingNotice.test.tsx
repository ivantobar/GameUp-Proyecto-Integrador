import type { ReactNode } from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import SayStep from '@/app/student/speak/[vowel]/say';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import { PracticeSessionProvider } from '@/features/speak/PracticeSession';
import {
  NO_RECORDING_TEXT,
  noRecordingNotice,
} from '@/features/speak/noRecordingNotice';

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    back: jest.fn(),
    dismissTo: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
  useLocalSearchParams: jest.fn(() => ({ vowel: 'a' })),
  useIsFocused: jest.fn(() => true),
}));

/**
 * «Dilo» no graba en práctica libre ni sin autorización del acudiente (Ley
 * 1581). Para que en el celular no parezca un fallo, un aviso corto lo
 * explica debajo del espejo; lo lee también la narración y TalkBack.
 */
async function openSay(activityId: string | null, consent: boolean) {
  jest
    .mocked(useLocalSearchParams)
    .mockReturnValue(
      activityId ? { vowel: 'a', actividadId: activityId } : { vowel: 'a' },
    );
  const repositories = createMockRepositories({
    delayMs: 0,
    voiceConsent: () => consent,
  });
  await render(<SayStep />, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <RepositoryProvider repositories={repositories}>
        <PracticeSessionProvider>{children}</PracticeSessionProvider>
      </RepositoryProvider>
    ),
  });
  // Espera la consulta de la autorización.
  await act(async () => {
    await jest.runAllTimersAsync();
  });
}

/** Lo que lee el parlante del encabezado. */
const narration = () =>
  String(
    screen.getByRole('button', { name: 'Oír la instrucción' }).props
      .accessibilityHint,
  );

describe('qué aviso corresponde', () => {
  it('práctica libre: avisa, haya o no autorización', () => {
    expect(noRecordingNotice(false, 'granted')).toBe(
      NO_RECORDING_TEXT.freePractice,
    );
    expect(noRecordingNotice(false, 'denied')).toBe(
      NO_RECORDING_TEXT.freePractice,
    );
  });

  it('desde una tarea sin autorización: avisa que la familia no autorizó', () => {
    expect(noRecordingNotice(true, 'denied')).toBe(NO_RECORDING_TEXT.noConsent);
  });

  it('desde una tarea con autorización, o mientras carga: sin aviso', () => {
    expect(noRecordingNotice(true, 'granted')).toBeNull();
    expect(noRecordingNotice(true, 'unknown')).toBeNull();
  });
});

describe('«Dilo»: aviso debajo del espejo cuando no se graba', () => {
  it('práctica libre (sin tarea): «Práctica libre: tu voz no se graba»', async () => {
    await openSay(null, true);
    const notice = screen.getByTestId('no-recording-notice');
    expect(notice).toHaveProp(
      'accessibilityLabel',
      'Práctica libre: tu voz no se graba',
    );
    expect(
      screen.getByText('Práctica libre: tu voz no se graba'),
    ).toBeOnTheScreen();
    expect(narration()).toContain('Práctica libre: tu voz no se graba.');
    // Sigue igual que antes: sin micrófono, con «Ya lo dije».
    expect(
      screen.getByRole('button', { name: 'Ya lo dije' }),
    ).toBeOnTheScreen();
  });

  it('desde una tarea sin autorización: «Tu familia aún no autorizó grabar tu voz»', async () => {
    await openSay('act-demo-002', false);
    expect(screen.getByTestId('no-recording-notice')).toHaveProp(
      'accessibilityLabel',
      'Tu familia aún no autorizó grabar tu voz',
    );
    expect(narration()).toContain('Tu familia aún no autorizó grabar tu voz.');
    expect(
      screen.getByRole('button', { name: 'Ya lo dije' }),
    ).toBeOnTheScreen();
  });

  it('desde una tarea con autorización: sin aviso, con el micrófono', async () => {
    await openSay('act-demo-002', true);
    expect(screen.queryByTestId('no-recording-notice')).toBeNull();
    expect(narration()).not.toContain('no se graba');
    expect(narration()).not.toContain('no autorizó');
    expect(
      screen.getByRole('button', { name: 'Grabar mi voz' }),
    ).toBeOnTheScreen();
  });
});
