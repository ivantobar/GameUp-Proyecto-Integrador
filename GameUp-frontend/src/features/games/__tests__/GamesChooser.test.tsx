import { act, render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import GamesScreen from '@/app/student/(tabs)/games';
import TasksScreen from '@/app/student/tasks';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';
import type { Assignment } from '@/data/types';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    navigate: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock('@/data/useRefreshOnFocus', () => ({
  useRefreshOnFocus: jest.fn(),
}));

const settle = () =>
  act(async () => {
    await jest.runAllTimersAsync();
  });

async function renderWith(element: React.ReactElement, repos: Repositories) {
  await render(
    <RepositoryProvider repositories={repos}>{element}</RepositoryProvider>,
  );
  await settle();
}

const tareas: Assignment[] = [
  {
    id: '7:11',
    activityId: '11',
    gameId: 'match',
    status: 'rejected',
    isNew: false,
    moduleId: '3',
    moduleTitle: 'Los colores',
  },
  {
    id: '8:20',
    activityId: '20',
    gameId: 'classify',
    status: 'assigned',
    isNew: true,
    moduleId: '4',
    moduleTitle: 'Los animales',
  },
];

function reposWith(pending: Assignment[]) {
  const repos = createMockRepositories({ delayMs: 0 });
  jest
    .spyOn(repos.assignments, 'listPendingForStudent')
    .mockResolvedValue(pending);
  return repos;
}

describe('Juegos: elegir entre tareas y niveles', () => {
  beforeEach(() => jest.mocked(router.push).mockClear());

  it('dos botones grandes: tareas (con sus temas) y niveles', async () => {
    await renderWith(<GamesScreen />, reposWith(tareas));

    expect(screen.getByText('2 temas')).toBeOnTheScreen();
    expect(screen.getByText('Nuevo')).toBeOnTheScreen();
    // Aquí no se mezclan los juegos ni los módulos.
    expect(screen.queryByText('Memoria')).toBeNull();
    expect(screen.queryByText('Los colores')).toBeNull();

    await userEvent.press(
      screen.getByRole('button', { name: /^Tareas de mi profe/ }),
    );
    expect(router.push).toHaveBeenLastCalledWith('/student/tasks');
    await userEvent.press(
      screen.getByRole('button', { name: /^Jugar por niveles/ }),
    );
    expect(router.push).toHaveBeenLastCalledWith('/student/levels');
  });

  it('sin tareas: «Hoy no hay» y sin insignia', async () => {
    await renderWith(<GamesScreen />, reposWith([]));
    expect(screen.getByText('Hoy no hay')).toBeOnTheScreen();
    expect(screen.queryByText('Nuevo')).toBeNull();
  });
});

describe('Tareas de mi profe', () => {
  beforeEach(() => jest.mocked(router.push).mockClear());

  it('una tarjeta por módulo que abre su pantalla', async () => {
    await renderWith(<TasksScreen />, reposWith(tareas));

    expect(screen.getByText('Los colores')).toBeOnTheScreen();
    expect(screen.getByText('Los animales')).toBeOnTheScreen();
    expect(screen.getByText('Otra vez')).toBeOnTheScreen();

    await userEvent.press(screen.getByRole('button', { name: /Los animales/ }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/student/module/[moduleId]',
      params: { moduleId: '4' },
    });
  });

  it('sin tareas: lo invita a jugar por niveles', async () => {
    await renderWith(<TasksScreen />, reposWith([]));
    expect(screen.getByText('Hoy no tienes tareas')).toBeOnTheScreen();
    await userEvent.press(
      screen.getByRole('button', { name: /Jugar por niveles/ }),
    );
    expect(router.replace).toHaveBeenCalledWith('/student/levels');
  });
});
