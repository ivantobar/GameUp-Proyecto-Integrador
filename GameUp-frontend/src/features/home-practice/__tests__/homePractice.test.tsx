import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import { homeSteps } from '../homeSteps';
import { useWeeklyPractice } from '../useWeeklyPractice';

const repositories = createMockRepositories({ delayMs: 0 });

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <RepositoryProvider repositories={repositories}>
      {children}
    </RepositoryProvider>
  );
}

describe('Practicar en casa', () => {
  it('los pasos usan el sonido de la semana', () => {
    const steps = homeSteps('o');
    expect(steps).toHaveLength(4);
    expect(steps[1]).toBe('Haz el gesto y di «o» despacio, dos veces.');
  });

  it('muestra la nota de la profe y registra «Lo practicamos hoy»', async () => {
    const { result } = await renderHook(() => useWeeklyPractice(), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.resource.status).toBe('ready'));
    if (result.current.resource.status !== 'ready') return;
    expect(result.current.resource.data.week.teacherNote?.text).toContain(
      'oso, ojo, ola',
    );
    expect(result.current.resource.data.week.practicedToday).toBe(false);

    await act(async () => {
      result.current.markPracticedToday().catch(() => {});
    });
    await waitFor(() => {
      const r = result.current.resource;
      expect(r.status === 'ready' && r.data.week.practicedToday).toBe(true);
    });
    expect(result.current.markState).toBe('idle');
  });
});
