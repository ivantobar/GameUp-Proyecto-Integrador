import { useCallback, useState } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import type {
  StaffProfile,
  StudentSummary,
  WeeklyPractice,
} from '@/data/types';

interface GuardianWeek {
  guardian: StaffProfile;
  /** Sus estudiantes asociados (si son varios, elige a quién ver). */
  students: StudentSummary[];
  week: WeeklyPractice;
}

export type MarkState = 'idle' | 'saving' | 'error';

/**
 * «Practicar en casa»: el sonido de la semana del estudiante asociado, la
 * nota de la profe, lo que dijo en las actividades y el registro «Lo
 * practicamos hoy». El acudiente solo recibe a sus estudiantes (regla 5:
 * lo verifica el backend); si tiene varios, elige a quién ver.
 */
export function useWeeklyPractice() {
  const { staff, guardians } = useRepositories();
  const [markState, setMarkState] = useState<MarkState>('idle');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async (): Promise<GuardianWeek> => {
    const guardian = await staff.getCurrentGuardian();
    const [students, week] = await Promise.all([
      guardians.listStudents(guardian.id),
      guardians.getWeeklyPractice(guardian.id, selectedId ?? undefined),
    ]);
    return { guardian, students, week };
  }, [staff, guardians, selectedId]);

  const { resource, reload, refresh } = useResource(load);

  /** Ver la práctica de otro de sus estudiantes. */
  const selectStudent = useCallback((studentId: string) => {
    setMarkState('idle');
    setSelectedId(studentId);
  }, []);

  const markPracticedToday = useCallback(async () => {
    if (resource.status !== 'ready') return;
    const { guardian, week } = resource.data;
    setMarkState('saving');
    try {
      await guardians.markPracticedToday(guardian.id, week.student.id);
      setMarkState('idle');
      refresh();
    } catch (error) {
      console.warn(
        '[GameUP] No se pudo registrar la práctica',
        error instanceof Error ? error.name : 'Error',
      );
      setMarkState('error');
    }
  }, [resource, guardians, refresh]);

  return {
    resource,
    reload,
    refresh,
    markState,
    markPracticedToday,
    selectStudent,
  };
}
