import { render, screen, userEvent } from '@testing-library/react-native';
import { Button } from '../Button';
import { IconButton } from '../IconButton';

describe('Button', () => {
  it('se anuncia como botón con su texto y responde al toque', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(<Button label="Ahora tú" onPress={onPress} />);

    await user.press(screen.getByRole('button', { name: 'Ahora tú' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('deshabilitado: no responde y lo informa', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(<Button label="Siguiente" onPress={onPress} disabled />);

    const button = screen.getByRole('button', { name: 'Siguiente' });
    await user.press(button);

    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  it('cargando: no responde y lo informa como ocupado', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(<Button label="Probar conexión" onPress={onPress} loading />);

    const button = screen.getByRole('button', { name: 'Probar conexión' });
    await user.press(button);

    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeBusy();
  });

  it.each(['primary', 'secondary', 'accent', 'link'] as const)(
    'la variante %s respeta las mismas props base',
    async (variant) => {
      const onPress = jest.fn();
      const user = userEvent.setup();
      await render(
        <Button
          label="Continuar"
          variant={variant}
          onPress={onPress}
          accessibilityHint="Vuelve al juego"
        />,
      );
      await user.press(screen.getByRole('button', { name: 'Continuar' }));
      expect(onPress).toHaveBeenCalledTimes(1);
    },
  );
});

describe('IconButton', () => {
  it('usa el accessibilityLabel como nombre', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(
      <IconButton
        icon="speaker"
        accessibilityLabel="Oír la instrucción"
        onPress={onPress}
      />,
    );

    await user.press(
      screen.getByRole('button', { name: 'Oír la instrucción' }),
    );

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
