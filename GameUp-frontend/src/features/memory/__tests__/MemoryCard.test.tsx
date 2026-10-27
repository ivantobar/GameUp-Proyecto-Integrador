import { render, screen, userEvent } from '@testing-library/react-native';
import { MemoryCard } from '../components/MemoryCard';

const dog = { id: 'perro', label: 'perro', emoji: '🐶' };

describe('MemoryCard', () => {
  it('boca abajo: no dice qué dibujo tiene y se puede voltear', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(
      <MemoryCard position={1} face={dog} view="down" onPress={onPress} />,
    );
    await user.press(
      screen.getByRole('button', { name: 'Carta 1, boca abajo' }),
    );
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('distinta: lo dice con palabras y se puede tocar para seguir', async () => {
    await render(
      <MemoryCard
        position={2}
        face={dog}
        view="mismatch"
        onPress={jest.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Carta 2, perro, no es su pareja' }),
    ).toBeEnabled();
  });

  it('pareja: «¡Pareja!» y queda fija', async () => {
    await render(
      <MemoryCard position={3} face={dog} view="matched" onPress={jest.fn()} />,
    );
    expect(screen.getByText('¡Pareja!')).toBeOnTheScreen();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
