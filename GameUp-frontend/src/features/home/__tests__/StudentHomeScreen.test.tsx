import { act, render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import StudentHome from '@/app/student/(tabs)/index';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import type { Repositories } from '@/data/repositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), navigate: jest.fn() },
}));
jest.mock('@/data/useRefreshOnFocus', () => ({
  useRefreshOnFocus: jest.fn(),
}));

async function renderHome(repositories: Repositories) {
  await render(
    <RepositoryProvider repositories={repositories}>
      <StudentHome />
    </RepositoryProvider>,
  );
  await act(async () => {
    await jest.runAllTimersAsync();
  });
}

/** Inicio: la tarea de la profe en grande y accesos pequeños debajo. */
describe('Inicio del estudiante', () => {
  beforeEach(() => jest.clearAllMocks());

  it('con tarea: «Haz esta tarea» grande, «Sigue donde ibas» y los accesos', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderHome(createMockRepositories({ delayMs: 0 }));

    expect(screen.getByText('¡Hola, Martín!')).toBeOnTheScreen();
    expect(
      screen.getByRole('header', { name: 'Haz esta tarea' }),
    ).toBeOnTheScreen();
    expect(screen.getByText('Busca la boca')).toBeOnTheScreen();
    // Con tarea, «Continuar» baja a un acceso pequeño.
    expect(screen.queryByRole('button', { name: 'Continuar' })).toBeNull();
    expect(
      screen.getByLabelText(/^Sigue donde ibas\. Habla conmigo · Sonido O$/),
    ).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: '¡Vamos!' }));
    expect(router.push).toHaveBeenCalledTimes(1);

    await user.press(screen.getByLabelText(/^Juegos\. 6 juegos$/));
    expect(router.navigate).toHaveBeenCalledWith('/student/games');
    await user.press(screen.getByLabelText(/^Mi progreso\. 4 temas$/));
    expect(router.navigate).toHaveBeenCalledWith('/student/progress');
  });

  it('sin tareas: «Continuar» es la tarjeta grande', async () => {
    const repos = createMockRepositories({ delayMs: 0 });
    repos.assignments.listPendingForStudent = () => Promise.resolve([]);
    await renderHome(repos);

    expect(screen.queryByText('Haz esta tarea')).toBeNull();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeOnTheScreen();
    expect(screen.queryByLabelText(/^Sigue donde ibas\./)).toBeNull();
  });
});
