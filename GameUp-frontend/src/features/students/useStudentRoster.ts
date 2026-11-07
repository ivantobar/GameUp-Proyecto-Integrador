import { useCallback } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import type { StudentSummary } from '@/data/types';
import { overallPercent } from './assignmentText';
import { runLimited } from './runLimited';

/** Pedidos de progreso a la vez: no satura la red ni el backend. */
export const PROGRESS_CONCURRENCY = 5;

export interface RosterRow {
  student: StudentSummary;
  /**
   * Progreso oficial de 0 a 100 (solo lo validado), o `null` si no se pudo
   * cargar: esa fila dice «Progreso no disponible» y las demás siguen.
   */
  percent: number | null;
}

/**
 * Estudiantes que puede ver el adulto con sesión, cada uno con su progreso
 * oficial. Si falla la lista, falla la pantalla; si falla el progreso de un
 * estudiante, solo esa fila.
 */
export function useStudentRoster() {
  const { directory } = useRepositories();

  const load = useCallback(async (): Promise<RosterRow[]> => {
    const students = await directory.listStudents();
    const progress = await runLimited(
      students,
      PROGRESS_CONCURRENCY,
      (student) => directory.getStudentProgress(student.id),
    );
    return students.map((student, index) => {
      const result = progress[index];
      return {
        student,
        percent: result?.ok ? overallPercent(result.value) : null,
      };
    });
  }, [directory]);

  return useResource(load);
}
