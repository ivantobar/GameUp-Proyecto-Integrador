import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { MOCK_PASSWORD, mockStudent } from '@/data/mock/fixtures';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';
import type { OfficialProgress } from '@/data/types';
import {
  normalizeName,
  PROGRESS_CONCURRENCY,
  ROSTER_PAGE_SIZE,
  useStudentRoster,
} from '../useStudentRoster';

const settle = () =>
  act(async () => {
    await jest.runAllTimersAsync();
  });

async function renderRoster(repositories: Repositories) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <RepositoryProvider repositories={repositories}>
      {children}
    </RepositoryProvider>
  );
  const hook = await renderHook(() => useStudentRoster(), { wrapper });
  await settle();
  await waitFor(() =>
    expect(hook.result.current.resource.status).toBe('ready'),
  );
  await settle();
  return hook;
}

/** Repositorios simulados con `count` estudiantes y progreso contado. */
function manyStudents(count: number) {
  const repos = createMockRepositories({ delayMs: 0 });
  repos.directory.listStudents = () =>
    Promise.resolve(
      Array.from({ length: count }, (_, i) => ({
        id: `e${i}`,
        displayName: `Estudiante ${i}`,
        initials: 'EE',
      })),
    );
  const stats = { calls: 0, running: 0, peak: 0 };
  repos.directory.getStudentProgress = async () => {
    stats.calls += 1;
    stats.running += 1;
    stats.peak = Math.max(stats.peak, stats.running);
    await new Promise((resolve) => setTimeout(resolve, 5));
    stats.running -= 1;
    const progress: OfficialProgress = { modules: [], pendingValidation: 0 };
    return progress;
  };
  return { repos, stats };
}

describe('normalizeName', () => {
  it('ignora mayúsculas, tildes y espacios', () => {
    expect(normalizeName('  María José ')).toBe('maria jose');
    expect(normalizeName('LUCÍA')).toBe('lucia');
    expect(normalizeName('Ñandú')).toBe('nandu');
  });
});

describe('useStudentRoster', () => {
  it('muestra a sus estudiantes con el progreso oficial', async () => {
    const { result } = await renderRoster(
      createMockRepositories({ delayMs: 0 }),
    );

    const rows = result.current.rows;
    expect(rows.map((r) => r.student.displayName)).toEqual([
      'Martín C.',
      'Valentina G.',
      'Samuel O.',
    ]);
    // Martín: (8 + 11 + 1 + 0) / (10 + 20 + 10 + 6) = 20 / 46 → 43 %.
    expect(rows[0]?.percent).toBe(43);
    // Samuel no tiene módulos: 0 %.
    expect(rows[2]?.percent).toBe(0);
  });

  it('si falla el progreso de uno, solo esa fila queda sin progreso', async () => {
    const repos = createMockRepositories({ delayMs: 0 });
    const original = repos.directory.getStudentProgress;
    repos.directory.getStudentProgress = (id) =>
      id === mockStudent.id
        ? Promise.reject(new Error('sin red'))
        : original(id);

    const { result } = await renderRoster(repos);

    expect(result.current.rows).toHaveLength(3);
    expect(result.current.rows[0]?.percent).toBeNull();
    expect(result.current.rows[1]?.percent).toBe(40);
  });

  it('busca sin distinguir mayúsculas ni tildes', async () => {
    const repos = createMockRepositories({ delayMs: 0 });
    // La directora ve a todos, también a Lucía.
    const signedIn = repos.auth.signIn({
      email: 'directora@gameup.test',
      password: MOCK_PASSWORD,
    });
    await jest.runAllTimersAsync();
    await signedIn;
    const { result } = await renderRoster(repos);

    await act(async () => result.current.setQuery('lucia'));
    expect(result.current.rows.map((r) => r.student.displayName)).toEqual([
      'Lucía R.',
    ]);

    await act(async () => result.current.setQuery('MARTÍN'));
    expect(result.current.rows.map((r) => r.student.displayName)).toEqual([
      'Martín C.',
    ]);

    await act(async () => result.current.setQuery('zzz'));
    expect(result.current.rows).toEqual([]);
    expect(result.current.matchCount).toBe(0);
  });

  it(`pide el progreso solo de las filas visibles, de a ${ROSTER_PAGE_SIZE}`, async () => {
    const { repos, stats } = manyStudents(45);
    const { result } = await renderRoster(repos);

    expect(result.current.rows).toHaveLength(ROSTER_PAGE_SIZE);
    expect(stats.calls).toBe(ROSTER_PAGE_SIZE);
    expect(result.current.hasMore).toBe(true);

    await act(async () => result.current.showMore());
    await settle();
    expect(result.current.rows).toHaveLength(ROSTER_PAGE_SIZE * 2);
    expect(stats.calls).toBe(ROSTER_PAGE_SIZE * 2);

    await act(async () => result.current.showMore());
    await settle();
    expect(result.current.rows).toHaveLength(45);
    expect(result.current.hasMore).toBe(false);
    expect(stats.calls).toBe(45);
  });

  it('buscar no dispara pedidos de más: solo los visibles que faltan', async () => {
    const { repos, stats } = manyStudents(45);
    const { result } = await renderRoster(repos);
    expect(stats.calls).toBe(ROSTER_PAGE_SIZE);

    // «Estudiante 4» y «Estudiante 40»…«44»: 6 filas; 4 ya tenía progreso.
    await act(async () => result.current.setQuery('estudiante 4'));
    await settle();

    expect(result.current.rows).toHaveLength(6);
    expect(stats.calls).toBe(ROSTER_PAGE_SIZE + 5);
  });

  it(`nunca hay más de ${PROGRESS_CONCURRENCY} pedidos a la vez, ni con «Ver más» seguidos`, async () => {
    const { repos, stats } = manyStudents(60);
    const hook = await renderHook(() => useStudentRoster(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <RepositoryProvider repositories={repos}>{children}</RepositoryProvider>
      ),
    });
    // Sin esperar a que terminen: «Ver más» dos veces seguidas.
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => hook.result.current.showMore());
    await act(async () => hook.result.current.showMore());
    await settle();

    expect(stats.calls).toBe(60);
    expect(stats.peak).toBe(PROGRESS_CONCURRENCY);
  });

  it('refresh vuelve a pedir el progreso visible sin ocultar la lista', async () => {
    const repos = createMockRepositories({ delayMs: 0 });
    const spy = jest.spyOn(repos.directory, 'getStudentProgress');
    const { result } = await renderRoster(repos);
    expect(spy).toHaveBeenCalledTimes(3);

    await act(async () => result.current.refresh());
    // Mientras se actualiza, la lista y su progreso siguen a la vista.
    expect(result.current.resource.status).toBe('ready');
    expect(result.current.rows[0]?.percent).toBe(43);
    await settle();

    expect(spy).toHaveBeenCalledTimes(6);
  });

  it('si falla la lista, la pantalla muestra el error', async () => {
    const repos = createMockRepositories({ delayMs: 0 });
    repos.directory.listStudents = () => Promise.reject(new Error('sin red'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const hook = await renderHook(() => useStudentRoster(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <RepositoryProvider repositories={repos}>{children}</RepositoryProvider>
      ),
    });
    await settle();

    expect(hook.result.current.resource.status).toBe('error');
    warn.mockRestore();
  });
});
