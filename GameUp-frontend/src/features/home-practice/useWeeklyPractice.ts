import { useCallback, useState } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import type { StaffProfile, WeeklyPractice } from '@/data/types';

interface GuardianWeek {
  guardian: StaffProfile;
  week: WeeklyPractice;
}

export type MarkState = 'idle' | 'saving' | 'error';

/**
 * «Practicar en casa»: el sonido de la semana del estudiante asociado, la
 * nota de la profe y el registro «Lo practicamos hoy». El acudiente solo
 * recibe a su estudiante (regla 5; el backend debe verificarlo).
 */
export function useWeeklyPractice() {
  const { staff, guardians } = useRepositories();
  const [markState, setMarkState] = useState<MarkState>('idle');

  const load = useCallback(async (): Promise<GuardianWeek> => {
    const guardian = await staff.getCurrentGuardian();
    const week = await guardians.getWeeklyPractice(guardian.id);
    return { guardian, week };
  }, [staff, guardians]);

  const { resource, reload, refresh } = useResource(load);

  const markPracticedToday = useCallback(async () => {
    if (resource.status !== 'ready') return;
    const { guardian, week } = resource.data;
    setMarkState('saving');
    try {
      await guardians.markPracticedToday(guardian.id, week.student.id);
      setMarkState('idle');
      refresh();
    } catch (error) {
      console.warn('[GameUP] No se pudo registrar la práctica', error);
      setMarkState('error');
    }
  }, [resource, guardians, refresh]);

  return { resource, reload, refresh, markState, markPracticedToday };
}
