import { act, render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import LoginScreen from '@/app/login';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { MOCK_PASSWORD } from '@/data/mock/fixtures';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
}));

async function renderLogin(repositories: Repositories) {
  await render(
    <RepositoryProvider repositories={repositories}>
      <LoginScreen />
    </RepositoryProvider>,
  );
}

async function signIn(email: string, password: string) {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByTestId('login-email'), email);
  if (password) await user.type(screen.getByTestId('login-password'), password);
  await user.press(screen.getByRole('button', { name: 'Entrar' }));
  // Los repositorios simulados responden con setTimeout.
  await act(async () => {
    await jest.runAllTimersAsync();
  });
}

describe('Iniciar sesión (simulado)', () => {
  beforeEach(() => {
    jest.mocked(router.replace).mockClear();
  });

  it('con campos vacíos avisa qué falta y no llama al repositorio', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    const spy = jest.spyOn(repositories.auth, 'signIn');
    await renderLogin(repositories);

    await signIn('', '');

    expect(screen.getByText('Escribe tu correo.')).toBeOnTheScreen();
    expect(screen.getByText('Escribe tu contraseña.')).toBeOnTheScreen();
    expect(spy).not.toHaveBeenCalled();
  });

  it('la docente entra y va a «Por escuchar»', async () => {
    await renderLogin(createMockRepositories({ delayMs: 0 }));

    await signIn('Docente@gameup.test ', MOCK_PASSWORD);

    expect(router.replace).toHaveBeenCalledWith('/teacher');
  });

  it('con una contraseña equivocada muestra el aviso y no navega', async () => {
    await renderLogin(createMockRepositories({ delayMs: 0 }));

    await signIn('acudiente@gameup.test', 'otra-clave');

    expect(screen.getByText('No pudimos entrar')).toBeOnTheScreen();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('si falla la conexión lo dice sin culpar a la persona', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    jest
      .spyOn(repositories.auth, 'signIn')
      .mockRejectedValue(new Error('Network request failed'));
    await renderLogin(repositories);

    await signIn('docente@gameup.test', MOCK_PASSWORD);

    expect(screen.getByText('Sin conexión')).toBeOnTheScreen();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('la directora entra, pero su espacio todavía no existe', async () => {
    await renderLogin(createMockRepositories({ delayMs: 0 }));

    await signIn('directora@gameup.test', MOCK_PASSWORD);

    expect(
      screen.getByText('Tu espacio en GameUP llega en una próxima versión.'),
    ).toBeOnTheScreen();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('el botón del ojo muestra y oculta la contraseña', async () => {
    const user = userEvent.setup();
    await renderLogin(createMockRepositories({ delayMs: 0 }));

    expect(screen.getByTestId('login-password')).toHaveProp(
      'secureTextEntry',
      true,
    );
    await user.press(
      screen.getByRole('button', { name: 'Mostrar la contraseña' }),
    );
    expect(screen.getByTestId('login-password')).toHaveProp(
      'secureTextEntry',
      false,
    );
    expect(
      screen.getByRole('button', { name: 'Ocultar la contraseña' }),
    ).toBeOnTheScreen();
  });
});
