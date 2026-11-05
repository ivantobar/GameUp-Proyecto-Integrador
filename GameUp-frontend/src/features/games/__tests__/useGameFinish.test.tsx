import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { router } from 'expo-router';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';
import { useGameFinish } from '../useGameFinish';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

function wrapperWith(repositories: Repositories) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <RepositoryProvider repositories={repositories}>
        {children}
      </RepositoryProvider>
    );
  };
}

const score = { kind: 'turns', firstTryCorrect: 2, total: 3 } as const;

async function finishWith(
  repositories: Repositories,
  activityId: string | null,
  times = 1,
) {
  const { result } = await renderHook(
    () => useGameFinish('match', activityId),
    { wrapper: wrapperWith(repositories) },
  );
  await act(async () => {
    const done = Array.from({ length: times }, () =>
      result.current.finish(score),
    );
    await jest.runAllTimersAsync();
    await Promise.all(done);
  });
}

describe('cierre de los juegos de «Pensar y recordar»', () => {
  beforeEach(() => {
    jest.mocked(router.replace).mockClear();
  });

  it('desde una tarea: envía una sola vez aunque se toque «Terminar» de nuevo', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    const submit = jest.spyOn(repositories.results, 'submitGameResult');

    await finishWith(repositories, '20', 2);

    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ gameId: 'match', activityId: '20', score }),
    );
    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith({
      pathname: '/student/match/done',
      params: { envio: 'review', actividadId: '20' },
    });
  });

  it('juego libre: va al final como práctica, sin actividad', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });

    await finishWith(repositories, null);

    expect(router.replace).toHaveBeenCalledWith({
      pathname: '/student/match/done',
      params: { envio: 'practice' },
    });
  });

  it('Regla 11: si el envío falla, va al final igual y avisa al adulto', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    repositories.results.submitGameResult = () =>
      Promise.reject(new Error('sin red'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await finishWith(repositories, '20');

    expect(router.replace).toHaveBeenCalledWith({
      pathname: '/student/match/done',
      params: { envio: 'notSent', actividadId: '20' },
    });
    // Sin datos del niño en el registro.
    expect(warn).toHaveBeenCalledWith(
      '[GameUP] No se pudo enviar el juego',
      'Error',
    );
    warn.mockRestore();
  });
});
