import { act, render, screen, userEvent } from '@testing-library/react-native';
import { useIsFocused } from 'expo-router';
import { useVideoPlayer } from 'expo-video';
import { expoSpeechNarrator } from '@/features/narration/narrator';
import { VIDEO_CREDIT } from '@/features/speak/vowelVideos';
import { GestureVideo } from '../GestureVideo';

jest.mock('expo-router', () => ({ useIsFocused: jest.fn(() => true) }));
jest.mock('@/features/narration/narrator', () => ({
  expoSpeechNarrator: { speak: jest.fn(), stop: jest.fn() },
}));

/** El reproductor falso de `__mocks__/expo-video.ts`. */
type FakePlayer = {
  play: jest.Mock;
  pause: jest.Mock;
  replay: jest.Mock;
  loop: boolean;
  status: string;
  emit: (event: string, payload?: unknown) => void;
};
const player = () =>
  jest.mocked(useVideoPlayer).mock.results.at(-1)!.value as FakePlayer;

describe('GestureVideo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useIsFocused).mockReturnValue(true);
  });

  it('se reproduce una vez, sin bucle, y muestra el crédito de la profe', async () => {
    await render(<GestureVideo vowel="a" />);

    expect(player().loop).toBe(false);
    expect(player().play).toHaveBeenCalledTimes(1);
    expect(screen.getByText(VIDEO_CREDIT)).toBeOnTheScreen();
    expect(VIDEO_CREDIT).toContain('Método Ventura de Patricia Ventura');
    expect(
      screen.getByLabelText('La profe Consuelo hace el gesto de la A'),
    ).toBeOnTheScreen();
    expect(screen.queryByText('Ver otra vez')).toBeNull();
  });

  it('calla al narrador antes de reproducir', async () => {
    await render(<GestureVideo vowel="e" />);

    expect(expoSpeechNarrator.stop).toHaveBeenCalled();
    const stopOrder = jest.mocked(expoSpeechNarrator.stop).mock
      .invocationCallOrder[0];
    expect(stopOrder).toBeLessThan(player().play.mock.invocationCallOrder[0]);
  });

  it('al terminar ofrece «Ver otra vez», que vuelve a empezar sin narrador', async () => {
    const user = userEvent.setup();
    await render(<GestureVideo vowel="o" />);

    await act(async () => player().emit('playToEnd'));
    const again = screen.getByRole('button', {
      name: 'Ver otra vez el gesto de la O',
    });
    jest.mocked(expoSpeechNarrator.stop).mockClear();

    await user.press(again);

    expect(expoSpeechNarrator.stop).toHaveBeenCalled();
    expect(player().replay).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Ver otra vez')).toBeNull();
  });

  it('al salir de la pantalla se pausa y al volver ofrece «Ver otra vez»', async () => {
    const { rerender } = await render(<GestureVideo vowel="a" />);
    await act(async () => player().emit('playingChange', { isPlaying: true }));
    expect(player().pause).not.toHaveBeenCalled();

    // «Ahora tú» abre «Dilo» encima: «Mira» sigue montada pero sin foco.
    jest.mocked(useIsFocused).mockReturnValue(false);
    await rerender(<GestureVideo vowel="a" />);
    expect(player().pause).toHaveBeenCalledTimes(1);
    await act(async () => player().emit('playingChange', { isPlaying: false }));

    // Al volver no sigue sonando solo.
    jest.mocked(useIsFocused).mockReturnValue(true);
    await rerender(<GestureVideo vowel="a" />);
    expect(player().play).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('button', { name: 'Ver otra vez el gesto de la A' }),
    ).toBeOnTheScreen();
  });

  it('si el video no abre, muestra un aviso suave', async () => {
    await render(<GestureVideo vowel="u" fallbackHint="Toca Oír el sonido." />);

    await act(async () => player().emit('statusChange', { status: 'error' }));

    expect(
      screen.getByText('No pudimos abrir el video. Toca Oír el sonido.'),
    ).toBeOnTheScreen();
    expect(
      screen.queryByLabelText('La profe Consuelo hace el gesto de la U'),
    ).toBeNull();
  });
});
