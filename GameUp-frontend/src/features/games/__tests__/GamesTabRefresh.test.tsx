import type { ReactElement } from 'react';
import { act, render, screen } from '@testing-library/react-native';
import GamesScreen from '@/app/student/(tabs)/games';
import ProgressScreen from '@/app/student/(tabs)/progress';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';
import { useRefreshOnFocus } from '@/data/useRefreshOnFocus';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), navigate: jest.fn(), back: jest.fn() },
}));

/**
 * «Volver a la pestaña» se simula llamando al refresco que la pantalla
 * registró con `useRefreshOnFocus` (en Jest, el router real del SDK 58 no
 * procesa un segundo cambio de pestaña con el reloj simulado).
 */
jest.mock('@/data/useRefreshOnFocus', () => ({
  useRefreshOnFocus: jest.fn(),
}));

function lastRegisteredRefresh(): () => void {
  const calls = jest.mocked(useRefreshOnFocus).mock.calls;
  const refresh = calls[calls.length - 1]?.[0];
  if (!refresh) throw new Error('La pantalla no registró el refresco');
  return refresh;
}

const settle = () =>
  act(async () => {
    await jest.runAllTimersAsync();
  });

async function renderWith(element: ReactElement, repos: Repositories) {
  await render(
    <RepositoryProvider repositories={repos}>{element}</RepositoryProvider>,
  );
  await settle();
}

describe('las pestañas se actualizan al volver a ellas', () => {
  beforeEach(() => {
    jest.mocked(useRefreshOnFocus).mockClear();
  });

  it('Juegos: después de hacer la tarea, su módulo ya no aparece', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    const pending = jest
      .spyOn(repositories.assignments, 'listPendingForStudent')
      .mockResolvedValueOnce([
        {
          id: 't1',
          activityId: '4',
          gameId: 'match',
          status: 'assigned',
          isNew: true,
          moduleId: '2',
          moduleTitle: 'Los animales',
        },
      ])
      // La tarea ya se hizo: queda pendiente de validación, no pendiente.
      .mockResolvedValue([]);

    await renderWith(<GamesScreen />, repositories);
    expect(screen.getByText('Los animales')).toBeOnTheScreen();

    await act(async () => {
      lastRegisteredRefresh()();
    });
    await settle();

    expect(pending).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('Los animales')).toBeNull();
  });

  it('Mi progreso: vuelve a pedir el progreso', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    const progress = jest.spyOn(repositories.progress, 'getOfficialProgress');

    await renderWith(<ProgressScreen />, repositories);
    await act(async () => {
      lastRegisteredRefresh()();
    });
    await settle();

    expect(progress).toHaveBeenCalledTimes(2);
  });
});
