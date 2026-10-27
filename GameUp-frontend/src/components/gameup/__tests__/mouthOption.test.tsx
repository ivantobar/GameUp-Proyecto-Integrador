import { render, screen, userEvent } from '@testing-library/react-native';
import { MouthOption } from '../MouthOption';

describe('MouthOption', () => {
  it('normal: describe la boca y responde al toque', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(<MouthOption vowel="o" state="idle" onPress={onPress} />);
    await user.press(screen.getByRole('button', { name: /Boca redonda/ }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('pista: lo dice con palabras («Prueba esta»), no solo con color', async () => {
    await render(<MouthOption vowel="o" state="hint" onPress={jest.fn()} />);
    expect(screen.getByText('Prueba esta')).toBeOnTheScreen();
  });

  it('correcta: «¡Es la O!» y ya no se puede volver a tocar', async () => {
    await render(<MouthOption vowel="o" state="correct" onPress={jest.fn()} />);
    expect(screen.getByText('¡Es la O!')).toBeOnTheScreen();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
