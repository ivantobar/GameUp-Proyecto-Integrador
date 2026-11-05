import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';
import { VOWELS } from '@/data/types';
import { buildRounds, OPTIONS_PER_ROUND } from '../mouthQuiz';
import { useFindMouthVowels } from '../useFindMouthVowels';

function wrapperWith(repositories: Repositories) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <RepositoryProvider repositories={repositories}>
        {children}
      </RepositoryProvider>
    );
  };
}

describe('Busca la boca con las vocales de la actividad', () => {
  it('una ronda por vocal de la actividad, siempre con 3 bocas', () => {
    const rounds = buildRounds(() => 0.5, ['a', 'u']);

    expect(rounds.map((r) => r.target).sort()).toEqual(['a', 'u']);
    rounds.forEach((round) => {
      expect(round.options).toHaveLength(OPTIONS_PER_ROUND);
      expect(round.options).toContain(round.target);
      expect(new Set(round.options).size).toBe(OPTIONS_PER_ROUND);
    });
  });

  it('juego libre: las cinco vocales, sin pedir nada', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    const spy = jest.spyOn(repositories.activities, 'getActivity');
    const { result } = await renderHook(() => useFindMouthVowels(null), {
      wrapper: wrapperWith(repositories),
    });

    await waitFor(() => expect(result.current.resource.status).toBe('ready'));
    if (result.current.resource.status !== 'ready') return;
    expect(result.current.resource.data).toEqual(VOWELS);
    expect(spy).not.toHaveBeenCalled();
  });

  it('desde una tarea: las vocales de su actividad', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    repositories.activities.getActivity = (activityId) =>
      Promise.resolve({
        activityId,
        gameId: 'findMouth',
        title: 'Busca la boca',
        vowels: ['e', 'i'],
      });
    const { result } = await renderHook(() => useFindMouthVowels('9'), {
      wrapper: wrapperWith(repositories),
    });

    await waitFor(() => expect(result.current.resource.status).toBe('ready'));
    if (result.current.resource.status !== 'ready') return;
    expect(result.current.resource.data).toEqual(['e', 'i']);
  });

  it('si la actividad no es de este juego, queda en error (con «Reintentar»)', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    repositories.activities.getActivity = (activityId) =>
      Promise.resolve({
        activityId,
        gameId: 'speak',
        title: 'Di la a',
        vowel: 'a',
      });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = await renderHook(() => useFindMouthVowels('8'), {
      wrapper: wrapperWith(repositories),
    });

    await waitFor(() => expect(result.current.resource.status).toBe('error'));
    warn.mockRestore();
  });
});

describe('Busca la boca simulado con actividad', () => {
  async function run<T>(promise: Promise<T>): Promise<T> {
    await jest.runAllTimersAsync();
    return promise;
  }

  it('solo esa tarea pasa a realizada', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });

    const result = await run(
      repositories.results.submitFindMouthResult({
        studentId: 'est-demo-001',
        firstTryCorrect: 5,
        total: 5,
        activityId: 'act-demo-001',
      }),
    );
    const pending = await run(
      repositories.assignments.listPendingForStudent('est-demo-001'),
    );

    expect(result.sentForReview).toBe(true);
    expect(pending.map((a) => a.activityId)).toEqual(['act-demo-002']);
  });
});
