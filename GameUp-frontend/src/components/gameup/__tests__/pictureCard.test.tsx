import { render, screen, userEvent } from '@testing-library/react-native';
import { PictureCard } from '../PictureCard';
import { Pictogram } from '../Pictogram';

const apple = { id: 'manzana', label: 'manzana', emoji: '🍎' };

describe('PictureCard', () => {
  it('normal: se anuncia con su nombre y responde al toque', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(<PictureCard face={apple} state="idle" onPress={onPress} />);
    await user.press(screen.getByRole('button', { name: 'manzana' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('pista: lo dice con palabras («Prueba esta»), no solo con color', async () => {
    await render(<PictureCard face={apple} state="hint" onPress={jest.fn()} />);
    expect(screen.getByText('Prueba esta')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'manzana. Pista: prueba esta' }),
    ).toBeEnabled();
  });

  it('correcta: «¡Muy bien!» y ya no se puede volver a tocar', async () => {
    await render(
      <PictureCard face={apple} state="correct" onPress={jest.fn()} />,
    );
    expect(screen.getByText('¡Muy bien!')).toBeOnTheScreen();
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toBeSelected();
  });

  it('las demás opciones de una ronda resuelta no se pueden tocar', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(<PictureCard face={apple} state="dimmed" onPress={onPress} />);
    await user.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('puede mostrar el nombre debajo del dibujo (pasos de una rutina)', async () => {
    await render(
      <PictureCard
        face={{ id: 'jabon', label: 'Echar jabón', emoji: '🧼' }}
        state="idle"
        layout="tile"
        showLabel
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByText('Echar jabón')).toBeOnTheScreen();
  });
});

describe('Pictogram', () => {
  it('una cantidad repite el dibujo', async () => {
    await render(
      <Pictogram face={{ id: 'p', label: 'tres', emoji: '⭐', count: 3 }} />,
    );
    expect(
      screen.getAllByText('⭐', { includeHiddenElements: true }),
    ).toHaveLength(3);
  });
});
