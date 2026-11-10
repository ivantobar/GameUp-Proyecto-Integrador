import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
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
 * Por qué no se pudo quitar una asignación. Se muestra en su propia
 * tarjeta, donde estaba la confirmación, y no arriba, lejos del botón.
 */
export interface RowMessage {
  assignmentId: string;
  text: string;
}

/** Confirmación al volver de asignar un módulo. */
export function assignedText(
  moduleTitle: string,
  studentName: string | null,
): string {
  const text = `¡Listo! La actividad «${moduleTitle}» quedó asignada${
    studentName ? ` a ${studentName}` : ''
  }`;
  // «Martín C.» ya trae su punto: no se repite.
  return text.endsWith('.') ? text : `${text}.`;
}

/**
 * Detalle de un estudiante para el docente o la directora: progreso
 * oficial, asignaciones y la acción de quitar una (con confirmación).
 */
export function useStudentDetail(studentId: string) {
  const { directory, assignmentManagement } = useRepositories();
  const [message, setMessage] = useState<DetailMessage | null>(null);
  const [rowMessage, setRowMessage] = useState<RowMessage | null>(null);
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

  // Nombre del estudiante para el aviso de «asignada» (sin rehacer callbacks).
  const nameRef = useRef<string | null>(null);
  const loadedName =
    resource.status === 'ready' ? resource.data.student.displayName : null;
  useEffect(() => {
    if (loadedName) nameRef.current = loadedName;
  }, [loadedName]);

  /** Primer paso: pedir confirmación (no se puede deshacer). */
  const askRemove = useCallback((assignmentId: string) => {
    setMessage(null);
    setRowMessage(null);
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
        const text = removeErrorText(error);
        setRowMessage({ assignmentId: assignment.id, text });
        // La región en vivo solo funciona en Android: se anuncia también.
        AccessibilityInfo.announceForAccessibility(text);
      } finally {
        setBusyId(null);
        setConfirmingId(null);
      }
    },
    [assignmentManagement, refresh],
  );

  /** «¡Listo! La actividad «Letras» quedó asignada a Martín C.» */
  const showAssignedNotice = useCallback((moduleTitle: string) => {
    setMessage({
      tone: 'done',
      text: assignedText(moduleTitle, nameRef.current),
    });
  }, []);

  return {
    resource,
    reload,
    refresh,
    message,
    rowMessage,
    confirmingId,
    busyId,
    askRemove,
    cancelRemove,
    confirmRemove,
    showAssignedNotice,
  };
}
