import { act, render, screen, userEvent } from '@testing-library/react-native';
import type { ReviewItem } from '@/data/types';
import { ReviewCard } from '../components/ReviewCard';

/** Tarjeta de «Por revisar» con datos como los que da la API (fase 3). */
const speechItem: ReviewItem = {
  id: '41',
  kind: 'speech',
  student: { id: '5', displayName: 'Estrella P.', initials: 'EP' },
  submittedAt: new Date(2026, 10, 5, 16, 7).toISOString(),
  status: 'pending_validation',
  speech: {
    vowel: 'a',
    audioUri: null,
    remoteAudio: true,
    voiceConsent: true,
    attemptNumber: 1,
    attemptsTotal: 1,
  },
};

const now = new Date(2026, 10, 5, 18, 0);

async function renderCard(
  overrides: Partial<Parameters<typeof ReviewCard>[0]> = {},
) {
  const props = {
    item: speechItem,
    expanded: true,
    onExpand: jest.fn(),
    busy: false,
    onValidate: jest.fn(),
    onRequestMore: jest.fn(() => Promise.resolve(true)),
    onSaveVoiceNote: jest.fn(() => Promise.resolve(true)),
    loadRecording: jest.fn(() =>
      Promise.resolve('https://storage.prueba/voz.m4a?firma=x'),
    ),
    voiceNoteEnabled: false,
    shareOption: true,
    now,
    ...overrides,
  };
  await render(<ReviewCard {...props} />);
  return { props };
}

describe('revisión con la API', () => {
  it('con audio en el servidor: no se decide hasta escucharlo', async () => {
    const { props } = await renderCard();
    const user = userEvent.setup();

    expect(screen.getByRole('button', { name: 'Lo logró' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Practicar más' }),
    ).toBeDisabled();

    await user.press(
      screen.getByRole('button', {
        name: 'Escuchar: Voz de Estrella · intento 1 de 1',
      }),
    );
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(props.loadRecording).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Lo logró' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Practicar más' })).toBeEnabled();
  });

  it('sin grabación (NO_VERIFICABLE): explica el motivo y no bloquea', async () => {
    const { props } = await renderCard({
      item: {
        ...speechItem,
        speech: {
          ...speechItem.speech!,
          remoteAudio: false,
          voiceConsent: false,
          noAudioReason: 'notVerified',
        },
      },
    });

    expect(
      screen.getByText(/No se pudo verificar la autorización del acudiente/),
    ).toBeOnTheScreen();
    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Lo logró' }));
    expect(props.onValidate).toHaveBeenCalledTimes(1);
    expect(props.loadRecording).not.toHaveBeenCalled();
  });

  it('juego sin voz: lo que hizo, sin nota, y se decide de inmediato', async () => {
    const { props } = await renderCard({
      item: {
        ...speechItem,
        id: '50',
        kind: 'game',
        speech: undefined,
        game: {
          gameId: 'memory',
          title: 'Parejas de vocales',
          score: { kind: 'memory', pairs: 3, mismatches: 1 },
        },
      },
    });

    expect(screen.getByText('Memoria · hoy, 4:07 p. m.')).toBeOnTheScreen();
    expect(screen.getByText('Encontró las 3 parejas.')).toBeOnTheScreen();
    expect(
      screen.getByText('Abrió 1 vez dos cartas distintas.'),
    ).toBeOnTheScreen();
    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Lo logró' }));
    expect(props.onValidate).toHaveBeenCalledTimes(1);
  });

  it('sin nota de voz para la familia (D4) y con la opción de enviarle la indicación', async () => {
    const { props } = await renderCard({
      item: {
        ...speechItem,
        speech: { ...speechItem.speech!, remoteAudio: false },
      },
    });
    const user = userEvent.setup();

    expect(
      screen.queryByRole('button', {
        name: 'Dejar una nota de voz para la familia',
      }),
    ).toBeNull();

    await user.press(screen.getByRole('button', { name: 'Practicar más' }));
    await user.press(
      screen.getByRole('button', {
        name: 'Mira otra vez el gesto antes de decirlo.',
      }),
    );
    await user.press(
      screen.getByRole('button', {
        name: 'Enviar también como nota a la familia',
      }),
    );
    await user.press(screen.getByRole('button', { name: 'Enviar indicación' }));

    expect(props.onRequestMore).toHaveBeenCalledWith(
      'Mira otra vez el gesto antes de decirlo.',
      { shareWithFamily: true },
    );
  });
});
