import { act, render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import ModuleTasksScreen from '@/app/student/module/[moduleId]';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';
import type { Assignment } from '@/data/types';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), navigate: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ moduleId: '3' }),
}));

jest.mock('@/data/useRefreshOnFocus', () => ({
  useRefreshOnFocus: jest.fn(),
}));

const settle = () =>
  act(async () => {
    await jest.runAllTimersAsync();
  });

async function renderModule(repos: Repositories) {
  await render(
    <RepositoryProvider repositories={repos}>
      <ModuleTasksScreen />
    </RepositoryProvider>,
  );
  await settle();
}

const colores: Assignment[] = [
  {
    id: '7:12',
    activityId: '12',
    gameId: 'memory',
    status: 'assigned',
    isNew: true,
    title: 'Parejas de colores',
    moduleId: '3',
    moduleTitle: 'Los colores',
    order: 2,
  },
  {
    id: '7:11',
    activityId: '11',
    gameId: 'match',
    status: 'rejected',
    isNew: false,
    title: 'Une cada color',
    moduleId: '3',
    moduleTitle: 'Los colores',
    order: 1,
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

describe('pantalla de un módulo (tareas de la profe)', () => {
  beforeEach(() => jest.mocked(router.push).mockClear());

  it('muestra solo las tareas de ese módulo, en orden, y abre la actividad', async () => {
    const repos = createMockRepositories({ delayMs: 0 });
    jest
      .spyOn(repos.assignments, 'listPendingForStudent')
      .mockResolvedValue(colores);
    await renderModule(repos);

    expect(screen.getAllByText('Los colores').length).toBeGreaterThan(0);
    expect(screen.queryByText('Los animales')).toBeNull();
    const cards = screen.getAllByRole('button', {
      name: /Une cada color|Parejas de colores/,
    });
    expect(cards).toHaveLength(2);
    expect(screen.getByText('Otra vez')).toBeOnTheScreen();
    expect(screen.getByText('Nueva')).toBeOnTheScreen();

    await userEvent.press(
      screen.getByRole('button', { name: /Parejas de colores/ }),
    );
    // La actividad de la tarea, nunca el nivel de la escalera.
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/student/memory',
      params: { actividadId: '12' },
    });
  });

  it('sin tareas en ese módulo: «¡Terminaste este tema!»', async () => {
    const repos = createMockRepositories({ delayMs: 0 });
    jest
      .spyOn(repos.assignments, 'listPendingForStudent')
      .mockResolvedValue([]);
    await renderModule(repos);

    expect(screen.getByText('¡Terminaste este tema!')).toBeOnTheScreen();
  });
});
