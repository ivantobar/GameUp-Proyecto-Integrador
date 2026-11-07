import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createHttpRepositories } from '@/data/http/createHttpRepositories';
import { createMemoryTokenStore } from '@/data/http/tokenStore';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { MOCK_PASSWORD } from '@/data/mock/fixtures';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';
import { useReviewQueue } from '@/features/review/useReviewQueue';
import { createApiClient } from '@/services/api';
import { createFakeBackend, FAKE_API_URL } from '@/test-utils/fakeBackend';
import {
  createFakeFetch,
  errorResponse,
  jsonResponse,
} from '@/test-utils/fakeFetch';

const settle = () =>
  act(async () => {
    await jest.runAllTimersAsync();
  });

async function signIn(repos: Repositories, email: string) {
  const pending = repos.auth.signIn({ email, password: MOCK_PASSWORD });
  await jest.runAllTimersAsync();
  await pending;
}

async function renderQueue(repos: Repositories) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <RepositoryProvider repositories={repos}>{children}</RepositoryProvider>
  );
  const hook = await renderHook(() => useReviewQueue(), { wrapper });
  await settle();
  await waitFor(() =>
    expect(hook.result.current.resource.status).toBe('ready'),
  );
  return hook;
}

const studentsIn = (hook: Awaited<ReturnType<typeof renderQueue>>) => {
  const resource = hook.result.current.resource;
  return resource.status === 'ready'
    ? resource.data.items.map((i) => i.student.displayName)
    : [];
};

describe('«Por validar» con la sesión de la directora', () => {
  it('la directora ve los pendientes de todos; la docente, solo los suyos', async () => {
    const asDirector = createMockRepositories({ delayMs: 0 });
    await signIn(asDirector, 'directora@gameup.test');
    const director = await renderQueue(asDirector);

    const asTeacher = createMockRepositories({ delayMs: 0 });
    await signIn(asTeacher, 'docente@gameup.test');
    const teacher = await renderQueue(asTeacher);

    // Lucía no está a cargo de la docente.
    expect(studentsIn(director)).toContain('Lucía R.');
    expect(studentsIn(teacher)).not.toContain('Lucía R.');
    // La cola no depende de que la sesión sea de un docente.
    const resource = director.result.current.resource;
    expect(resource.status === 'ready' && resource.data.teacher.id).toBe(
      'dir-demo-001',
    );
  });

  it('también a la directora se le exige escuchar antes de validar (ListenFirstError)', async () => {
    // Backend falso que, como el real, responde 422 si no se pidió la
    // grabación antes de validar. Lo demás lo resuelve `fakeBackend`.
    const backend = createFakeBackend();
    const listened = new Set<string>();
    const fake = createFakeFetch((request) => {
      const match = /\/intentos\/([\w-]+)\/(grabacion|validacion)$/.exec(
        request.url,
      );
      if (match?.[2] === 'grabacion') {
        listened.add(match[1] ?? '');
        return jsonResponse(200, {
          url: 'https://audio.prueba/intento.m4a',
          expiraEn: '2026-11-05T16:00:00.000Z',
        });
      }
      if (match?.[2] === 'validacion' && !listened.has(match[1] ?? '')) {
        return errorResponse(
          422,
          'Antes de validar, escucha la grabación de este intento.',
        );
      }
      return backend.fetchFn(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.rawBody as string | undefined,
      });
    });
    const tokens = createMemoryTokenStore();
    const repos = createHttpRepositories(
      createApiClient({
        baseUrl: FAKE_API_URL,
        getToken: tokens.get,
        fetchFn: fake.fetchFn,
      }),
      tokens,
    );
    await signIn(repos, 'directora@gameup.test');
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = await renderQueue(repos);
    const resource = result.current.resource;
    if (resource.status !== 'ready') throw new Error('sin datos');
    const item = resource.data.items[0];
    if (!item) throw new Error('sin pendientes');

    // Sin escuchar: el backend lo rechaza y la app lo explica.
    await act(async () => {
      await result.current.validate(item);
    });
    expect(result.current.message).toEqual({
      tone: 'error',
      text: 'Primero escucha la grabación del intento: toca «Escuchar».',
    });
    const rejected = fake.requests.find((r) => r.url.endsWith('/validacion'));
    expect(rejected?.headers.Authorization).toBe(
      'Bearer token-de-prueba:directora@gameup.test',
    );

    // Después de escuchar, sí se valida.
    await act(async () => {
      await result.current.loadRecording(item);
      await result.current.validate(item);
    });
    expect(result.current.message?.tone).toBe('done');
    warn.mockRestore();
  });
});
