import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { mockStudent } from '@/data/mock/fixtures';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { Repositories } from '@/data/repositories';
import type { OfficialProgress } from '@/data/types';
import { PROGRESS_CONCURRENCY, useStudentRoster } from '../useStudentRoster';

async function renderRoster(repositories: Repositories) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <RepositoryProvider repositories={repositories}>
      {children}
    </RepositoryProvider>
  );
  const hook = await renderHook(() => useStudentRoster(), { wrapper });
  await act(async () => {
    await jest.runAllTimersAsync();
  });
  return hook;
}

describe('useStudentRoster', () => {
  it('muestra a sus estudiantes con el progreso oficial', async () => {
    const { result } = await renderRoster(
      createMockRepositories({ delayMs: 0 }),
    );

    await waitFor(() => expect(result.current.resource.status).toBe('ready'));
    if (result.current.resource.status !== 'ready') return;
    const rows = result.current.resource.data;
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
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = await renderRoster(repos);

    await waitFor(() => expect(result.current.resource.status).toBe('ready'));
    if (result.current.resource.status !== 'ready') return;
    const rows = result.current.resource.data;
    expect(rows).toHaveLength(3);
    expect(rows[0]?.percent).toBeNull();
    expect(rows[1]?.percent).toBe(40);
    warn.mockRestore();
  });

  it(`pide el progreso de a ${PROGRESS_CONCURRENCY} como máximo`, async () => {
    const repos = createMockRepositories({ delayMs: 0 });
    const many = Array.from({ length: 12 }, (_, i) => ({
      id: `e${i}`,
      displayName: `Estudiante ${i}`,
      initials: 'EE',
    }));
    repos.directory.listStudents = () => Promise.resolve(many);
    let running = 0;
    let peak = 0;
    repos.directory.getStudentProgress = async () => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running -= 1;
      const progress: OfficialProgress = { modules: [], pendingValidation: 0 };
      return progress;
    };

    const { result } = await renderRoster(repos);

    await waitFor(() => expect(result.current.resource.status).toBe('ready'));
    expect(peak).toBe(PROGRESS_CONCURRENCY);
  });

  it('si falla la lista, la pantalla muestra el error', async () => {
    const repos = createMockRepositories({ delayMs: 0 });
    repos.directory.listStudents = () => Promise.reject(new Error('sin red'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = await renderRoster(repos);

    await waitFor(() => expect(result.current.resource.status).toBe('error'));
    warn.mockRestore();
  });
});
