import { act, render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import ProgressScreen from '@/app/student/(tabs)/progress';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), navigate: jest.fn() },
}));
jest.mock('@/data/useRefreshOnFocus', () => ({
  useRefreshOnFocus: jest.fn(),
}));

const settle = () =>
  act(async () => {
    await jest.runAllTimersAsync();
  });

async function renderProgress(repositories: Repositories) {
  await render(
    <RepositoryProvider repositories={repositories}>
      <ProgressScreen />
    </RepositoryProvider>,
  );
  await settle();
}

describe('«Cerrar sesión» del estudiante (Mi progreso)', () => {
  beforeEach(() => {
    jest.mocked(router.replace).mockClear();
  });

  it('primero pregunta; no sale con un solo toque', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    const signOut = jest.spyOn(repositories.auth, 'signOut');
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderProgress(repositories);

    await user.press(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(screen.getByText('¿Salir de la cuenta?')).toBeOnTheScreen();
    expect(screen.getByText('Pídele ayuda a un adulto.')).toBeOnTheScreen();
    expect(signOut).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('«Cancelar» cierra la pregunta y sigue en la cuenta', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    const signOut = jest.spyOn(repositories.auth, 'signOut');
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderProgress(repositories);

    await user.press(screen.getByRole('button', { name: 'Cerrar sesión' }));
    await user.press(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByText('¿Salir de la cuenta?')).toBeNull();
    expect(signOut).not.toHaveBeenCalled();
  });

  it('«Salir» cierra la sesión y vuelve a «Iniciar sesión»', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    const signOut = jest.spyOn(repositories.auth, 'signOut');
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderProgress(repositories);

    await user.press(screen.getByRole('button', { name: 'Cerrar sesión' }));
    await user.press(screen.getByRole('button', { name: 'Salir' }));
    await settle();

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/login');
  });
});
