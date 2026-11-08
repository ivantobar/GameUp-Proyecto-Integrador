import { render, screen } from '@testing-library/react-native';
import { ConfigErrorScreen } from '../ConfigErrorScreen';

describe('ConfigErrorScreen', () => {
  it('muestra solo el mensaje para la familia, sin iniciar sesión', async () => {
    await render(<ConfigErrorScreen />);

    expect(screen.getByText('GameUP no está bien configurado')).toBeTruthy();
    expect(screen.getByText('Avísale a la fundación.')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText(/entrar/i)).toBeNull();
  });

  it('no muestra la URL ni detalles técnicos', async () => {
    await render(<ConfigErrorScreen />);

    expect(screen.queryByText(/https?:\/\//i)).toBeNull();
    expect(screen.queryByText(/EXPO_PUBLIC|api/i)).toBeNull();
  });
});
