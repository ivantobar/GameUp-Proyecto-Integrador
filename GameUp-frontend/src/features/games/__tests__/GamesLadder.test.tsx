import { act, render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import GamesScreen from '@/app/student/levels';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';
import type { GameLevel } from '@/data/types';
import { useRefreshOnFocus } from '@/data/useRefreshOnFocus';
import { CELEBRATION_MS } from '../components/LevelUpCelebration';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), navigate: jest.fn(), back: jest.fn() },
}));

jest.mock('@/data/useRefreshOnFocus', () => ({
  useRefreshOnFocus: jest.fn(),
}));

// Lo visto queda en un mapa (como el SecureStore del teléfono).
const mockGuardado = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (k: string) => mockGuardado.get(k) ?? null),
  setItemAsync: jest.fn(async (k: string, v: string) => {
    mockGuardado.set(k, v);
  }),
}));

const settle = () =>
  act(async () => {
    await jest.runAllTimersAsync();
  });

async function renderGames(repos: Repositories) {
  await render(
    <RepositoryProvider repositories={repos}>
      <GamesScreen />
    </RepositoryProvider>,
  );
  await settle();
}

function lastRefresh(): () => void {
  const calls = jest.mocked(useRefreshOnFocus).mock.calls;
  const refresh = calls[calls.length - 1]?.[0];
  if (!refresh) throw new Error('La pantalla no registró el refresco');
  return refresh;
}

const levelsAt = (memory: number): GameLevel[] =>
  (['match', 'classify', 'sequence', 'memory'] as const).map((gameId) => ({
    gameId,
    level: gameId === 'memory' ? memory : 1,
    completed: false,
    pendingReview: 0,
  }));

describe('Juegos con la escalera de niveles', () => {
  beforeEach(() => {
    mockGuardado.clear();
    jest.mocked(router.push).mockClear();
    jest.mocked(useRefreshOnFocus).mockClear();
  });

  it('los 4 juegos de pensar muestran su nivel con estrellas (sin números)', async () => {
    const repos = createMockRepositories({ delayMs: 0 });
    jest.spyOn(repos.levels, 'getMyLevels').mockResolvedValue(levelsAt(3));
    await renderGames(repos);

    expect(
      screen.getAllByTestId('level-stars', { includeHiddenElements: true }),
    ).toHaveLength(4);
    expect(
      screen.getByRole('button', { name: /^Memoria\. .*3 estrellas/ }),
    ).toBeOnTheScreen();
    expect(screen.queryByText(/nivel \d|te falta/i)).toBeNull();
  });

  it('sin tarea, la tarjeta abre el nivel actual del juego', async () => {
    const repos = createMockRepositories({ delayMs: 0 });
    jest
      .spyOn(repos.assignments, 'listPendingForStudent')
      .mockResolvedValue([]);
    await renderGames(repos);

    await userEvent.press(screen.getByRole('button', { name: /^Memoria\./ }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/student/memory',
      params: { escalera: '1' },
    });
  });

  it('aunque haya una tarea de ese juego, la tarjeta abre su nivel', async () => {
    const repos = createMockRepositories({ delayMs: 0 });
    jest.spyOn(repos.assignments, 'listPendingForStudent').mockResolvedValue([
      {
        id: 't1',
        activityId: '6',
        gameId: 'memory',
        status: 'assigned',
        isNew: true,
        moduleId: '3',
        moduleTitle: 'Los colores',
      },
    ]);
    await renderGames(repos);

    await userEvent.press(screen.getByRole('button', { name: /^Memoria\./ }));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: '/student/memory',
      params: { escalera: '1' },
    });
    // Las tareas no salen en «Jugar por niveles».
    expect(screen.queryByText('Los colores')).toBeNull();
  });

  it('si los niveles no cargan, los juegos se muestran igual (sin estrellas)', async () => {
    const repos = createMockRepositories({ delayMs: 0 });
    jest.spyOn(repos.levels, 'getMyLevels').mockRejectedValue(new Error('x'));
    await renderGames(repos);

    expect(
      screen.getByRole('button', { name: /^Memoria\./ }),
    ).toBeOnTheScreen();
    expect(
      screen.queryAllByTestId('level-stars', { includeHiddenElements: true }),
    ).toHaveLength(0);
  });

  it('al volver después de subir de nivel, celebra una vez y se cierra sola', async () => {
    const repos = createMockRepositories({ delayMs: 0 });
    const levels = jest
      .spyOn(repos.levels, 'getMyLevels')
      .mockResolvedValue(levelsAt(1));
    await renderGames(repos);
    // La primera vez no hay nada que celebrar.
    expect(screen.queryByText(/Subiste de nivel/)).toBeNull();

    // La profe aprobó: Memoria pasa al nivel 2.
    levels.mockResolvedValue(levelsAt(2));
    await act(async () => {
      lastRefresh()();
    });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10);
    });
    expect(screen.getByText('¡Subiste de nivel en Memoria!')).toBeOnTheScreen();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(CELEBRATION_MS);
    });
    expect(screen.queryByText('¡Subiste de nivel en Memoria!')).toBeNull();

    // Otra visita sin cambios: no vuelve a celebrar.
    await act(async () => {
      lastRefresh()();
    });
    await settle();
    expect(screen.queryByText(/Subiste de nivel/)).toBeNull();
  });
});
