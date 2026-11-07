import { useCallback, useState } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import type {
  OfficialProgress,
  StudentAssignment,
  StudentSummary,
} from '@/data/types';
import { removeErrorText } from './assignmentText';

export interface StudentDetail {
  student: StudentSummary;
  progress: OfficialProgress;
  assignments: StudentAssignment[];
}

/** Aviso tras una acción (se muestra en la pantalla). */
export interface DetailMessage {
  tone: 'done' | 'error';
  text: string;
}

/**
 * Detalle de un estudiante para el docente o la directora: progreso
 * oficial, asignaciones y la acción de quitar una (con confirmación).
 */
export function useStudentDetail(studentId: string) {
  const { directory, assignmentManagement } = useRepositories();
  const [message, setMessage] = useState<DetailMessage | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (): Promise<StudentDetail> => {
    const [student, progress, assignments] = await Promise.all([
      directory.getStudent(studentId),
      directory.getStudentProgress(studentId),
      assignmentManagement.listForStudent(studentId),
    ]);
    return { student, progress, assignments };
  }, [directory, assignmentManagement, studentId]);

  const { resource, reload, refresh } = useResource(load);

  /** Primer paso: pedir confirmación (no se puede deshacer). */
  const askRemove = useCallback((assignmentId: string) => {
    setMessage(null);
    setConfirmingId(assignmentId);
  }, []);

  const cancelRemove = useCallback(() => setConfirmingId(null), []);

  /** Segundo paso: quitar de verdad y actualizar sin ocultar lo que se ve. */
  const confirmRemove = useCallback(
    async (assignment: StudentAssignment) => {
      setBusyId(assignment.id);
      try {
        await assignmentManagement.remove(assignment.id);
        setMessage({
          tone: 'done',
          text: `Quitaste «${assignment.moduleTitle}».`,
        });
        refresh();
      } catch (error) {
        setMessage({ tone: 'error', text: removeErrorText(error) });
      } finally {
        setBusyId(null);
        setConfirmingId(null);
      }
    },
    [assignmentManagement, refresh],
  );

  const showAssignedNotice = useCallback(() => {
    setMessage({ tone: 'done', text: 'Actividad asignada' });
  }, []);

  return {
    resource,
    reload,
    refresh,
    message,
    confirmingId,
    busyId,
    askRemove,
    cancelRemove,
    confirmRemove,
    showAssignedNotice,
  };
}
