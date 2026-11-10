import { render, screen, userEvent } from '@testing-library/react-native';
import { router, useIsFocused } from 'expo-router';
import { useVideoPlayer } from 'expo-video';
import LookStep from '@/app/student/speak/[vowel]/look';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) },
  useLocalSearchParams: () => ({ vowel: 'e' }),
  useIsFocused: jest.fn(() => true),
}));

const player = () =>
  jest.mocked(useVideoPlayer).mock.results.at(-1)!.value as {
    play: jest.Mock;
    pause: jest.Mock;
  };

describe('Paso «Mira»', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useIsFocused).mockReturnValue(true);
  });

  it('«Ver el gesto» muestra el video de la profe y lo vuelve a ocultar', async () => {
    const user = userEvent.setup();
    await render(<LookStep />);
    const toggle = screen.getByRole('button', { name: 'Ver el gesto' });

    await user.press(toggle);
    expect(
      screen.getByLabelText('La profe Consuelo hace el gesto de la E'),
    ).toBeOnTheScreen();
    expect(player().play).toHaveBeenCalledTimes(1);

    await user.press(toggle);
    expect(
      screen.queryByLabelText('La profe Consuelo hace el gesto de la E'),
    ).toBeNull();
  });

  it('al tocar «Ahora tú», «Mira» queda debajo de «Dilo» y el video se pausa', async () => {
    const user = userEvent.setup();
    const { rerender } = await render(<LookStep />);
    await user.press(screen.getByRole('button', { name: 'Ver el gesto' }));

    await user.press(screen.getByRole('button', { name: 'Ahora tú' }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/student/speak/[vowel]/say',
      params: { vowel: 'e' },
    });
    expect(player().pause).not.toHaveBeenCalled();

    // La pila monta «Dilo» encima: «Mira» sigue montada pero pierde el foco.
    jest.mocked(useIsFocused).mockReturnValue(false);
    await rerender(<LookStep />);

    expect(player().pause).toHaveBeenCalledTimes(1);
    expect(player().play).toHaveBeenCalledTimes(1);
  });
});
