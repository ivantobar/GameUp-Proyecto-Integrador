import type { ReactNode } from 'react';
import { act, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import MemoryScreen from '@/app/student/memory/index';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { ladderContent } from '@/data/mock/ladderContent';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';

jest.setTimeout(90000);

async function renderAt(url: string, repositories: Repositories) {
  await renderRouter(
    { 'student/memory/index': MemoryScreen },
    {
      initialUrl: url,
      wrapper: ({ children }: { children: ReactNode }) => (
        <RepositoryProvider repositories={repositories}>
          {children}
        </RepositoryProvider>
      ),
    },
  );
  await act(async () => {
    await jest.runAllTimersAsync();
  });
}

describe('Memoria abierta en su nivel de la escalera', () => {
  it('pide la actividad del nivel actual y juega su tablero (nivel 5: 12 cartas)', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    const current = jest
      .spyOn(repositories.levels, 'getCurrentLevelActivity')
      .mockResolvedValue({
        level: {
          gameId: 'memory',
          level: 5,
          completed: false,
          pendingReview: 0,
        },
        content: ladderContent('memory', 5),
      });
    const getActivity = jest.spyOn(repositories.activities, 'getActivity');

    await renderAt('/student/memory?escalera=1', repositories);

    expect(current).toHaveBeenCalledWith('memory');
    expect(getActivity).not.toHaveBeenCalled();
    expect(screen.getAllByRole('button', { name: /^Carta \d+/ })).toHaveLength(
      12,
    );
  });

  it('sin escalera ni tarea, sigue siendo el juego libre (no pide nada)', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    const current = jest.spyOn(repositories.levels, 'getCurrentLevelActivity');

    await renderAt('/student/memory', repositories);

    expect(current).not.toHaveBeenCalled();
    expect(
      screen.getAllByRole('button', { name: /^Carta \d+/ }).length,
    ).toBeGreaterThan(0);
  });
});
