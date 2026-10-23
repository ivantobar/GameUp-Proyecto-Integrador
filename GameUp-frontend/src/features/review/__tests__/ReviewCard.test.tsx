import { render, screen, userEvent } from '@testing-library/react-native';
import type { ReviewItem } from '@/data/types';
import { ReviewCard } from '../components/ReviewCard';
import { noAudioMessage } from '../components/ReviewEvidence';

const item: ReviewItem = {
  id: 'r1',
  kind: 'speech',
  student: { id: 's1', displayName: 'Martín C.', initials: 'MC' },
  submittedAt: new Date(2026, 9, 22, 16, 10).toISOString(),
  status: 'pending_validation',
  speech: {
    vowel: 'o',
    audioUri: 'file:///cache/intento.m4a',
    voiceConsent: true,
    attemptNumber: 2,
    attemptsTotal: 2,
  },
};

const now = new Date(2026, 9, 22, 18, 0);

async function renderCard(
  overrides: Partial<Parameters<typeof ReviewCard>[0]> = {},
) {
  const props = {
    item,
    expanded: true,
    onExpand: jest.fn(),
    busy: false,
    onValidate: jest.fn(),
    onRequestMore: jest.fn(() => Promise.resolve(true)),
    onSaveVoiceNote: jest.fn(() => Promise.resolve(true)),
    now,
    ...overrides,
  };
  await render(<ReviewCard {...props} />);
  return { props };
}

describe('ReviewCard', () => {
  it('cerrada: muestra el resumen y un botón con nombre para abrirla', async () => {
    const { props } = await renderCard({ expanded: false });
    expect(
      await screen.findByText('Habla conmigo · Sonido O · hoy, 4:10 p. m.'),
    ).toBeOnTheScreen();
    const user = userEvent.setup();
    await user.press(
      screen.getByRole('button', { name: 'Revisar la actividad de Martín C.' }),
    );
    expect(props.onExpand).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Lo logró' })).toBeNull();
  });

  it('abierta: modelo, intento y la decisión del docente', async () => {
    const { props } = await renderCard();
    expect(
      await screen.findByRole('button', { name: 'Escuchar: Modelo' }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Escuchar: Martín · intento 2 de 2' }),
    ).toBeOnTheScreen();
    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Lo logró' }));
    expect(props.onValidate).toHaveBeenCalledTimes(1);
  });

  it('«Practicar más» pide una indicación antes de enviar', async () => {
    const { props } = await renderCard();
    const user = userEvent.setup();
    await user.press(
      await screen.findByRole('button', { name: 'Practicar más' }),
    );

    const send = screen.getByRole('button', { name: 'Enviar indicación' });
    expect(send).toBeDisabled();

    await user.press(
      screen.getByRole('button', {
        name: 'Hazlo más despacio, abriendo bien la boca.',
      }),
    );
    expect(send).toBeEnabled();
    await user.press(send);
    expect(props.onRequestMore).toHaveBeenCalledWith(
      'Hazlo más despacio, abriendo bien la boca.',
    );
  });

  it('sin grabación explica por qué, sin mostrar un audio vacío', async () => {
    await renderCard({
      item: {
        ...item,
        speech: { ...item.speech!, audioUri: null, voiceConsent: false },
      },
    });
    expect(await screen.findByText(noAudioMessage(false))).toBeOnTheScreen();
    expect(
      screen.queryByRole('button', { name: /Escuchar: Martín/ }),
    ).toBeNull();
  });
});
