import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';
import { ListenFirstError } from '@/data/reviewErrors';
import { useReviewQueue } from '../useReviewQueue';

/** Repositorios simulados con las funciones de la API (sin nota de voz). */
function apiLike(): Repositories {
  const repos = createMockRepositories({ delayMs: 0 });
  repos.reviews = {
    ...repos.reviews,
    features: { familyVoiceNote: false, feedbackAlwaysReachesFamily: false },
  };
  return repos;
}

async function renderQueue(repositories: Repositories) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <RepositoryProvider repositories={repositories}>
      {children}
    </RepositoryProvider>
  );
  const hook = await renderHook(() => useReviewQueue(), { wrapper });
  await act(async () => {
    await jest.runAllTimersAsync();
  });
  await waitFor(() =>
    expect(hook.result.current.resource.status).toBe('ready'),
  );
  const resource = hook.result.current.resource;
  if (resource.status !== 'ready') throw new Error('sin datos');
  const item = resource.data.items[0];
  if (!item) throw new Error('sin pendientes');
  return { ...hook, item };
}

async function settle<T>(promise: Promise<T>): Promise<T> {
  let value: T | undefined;
  await act(async () => {
    const pending = promise.then((v) => {
      value = v;
    });
    await jest.runAllTimersAsync();
    await pending;
  });
  return value as T;
}

describe('«Por escuchar» con la API', () => {
  it('«Practicar más» con la opción: la indicación también llega a la familia', async () => {
    const repositories = apiLike();
    const share = jest.spyOn(repositories.reviews, 'shareNoteWithFamily');
    const { result, item } = await renderQueue(repositories);

    await settle(
      result.current.requestMorePractice(item, 'Abre más la boca.', {
        shareWithFamily: true,
      }),
    );

    expect(share).toHaveBeenCalledWith(item.student.id, 'Abre más la boca.');
    expect(result.current.message?.text).toBe(
      `${item.student.displayName} practicará más. Tu nota llegó a la familia.`,
    );
  });

  it('sin la opción no se crea la nota ni se dice que llegó a la familia', async () => {
    const repositories = apiLike();
    const share = jest.spyOn(repositories.reviews, 'shareNoteWithFamily');
    const { result, item } = await renderQueue(repositories);

    await settle(result.current.requestMorePractice(item, 'Otra vez.'));

    expect(share).not.toHaveBeenCalled();
    expect(result.current.message?.text).toBe(
      `${item.student.displayName} practicará más.`,
    );
  });

  it('si se guardó la decisión pero no la nota, lo dice', async () => {
    const repositories = apiLike();
    repositories.reviews.shareNoteWithFamily = () =>
      Promise.reject(new Error('sin red'));
    const { result, item } = await renderQueue(repositories);

    const saved = await settle(
      result.current.requestMorePractice(item, 'Otra vez.', {
        shareWithFamily: true,
      }),
    );

    expect(saved).toBe(true);
    expect(result.current.message).toEqual({
      tone: 'error',
      text: `${item.student.displayName} practicará más, pero la nota no llegó a la familia. Revisa la conexión.`,
    });
  });

  it('si falta escuchar el audio, se lo pide al docente', async () => {
    const repositories = apiLike();
    repositories.reviews.validate = () =>
      Promise.reject(new ListenFirstError());
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { result, item } = await renderQueue(repositories);

    await settle(result.current.validate(item));

    expect(result.current.message).toEqual({
      tone: 'error',
      text: 'Primero escucha la grabación del intento: toca «Escuchar».',
    });
    warn.mockRestore();
  });
});
