import { useCallback, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import type { StudentTeacher } from '@/data/types';
import { removeTeacherErrorText } from './teacherText';
import type { DetailMessage } from './useStudentDetail';

/**
 * «Tallerista a cargo» de un estudiante (solo la directora): las de ahora,
 * el historial y quitar una (con confirmación).
 *
 * Con `enabled: false` (pantalla del docente) no pide nada al backend.
 */
export function useStudentTeachers(studentId: string, enabled: boolean) {
  const { teacherLinks } = useRepositories();
  const [message, setMessage] = useState<DetailMessage | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(
    (): Promise<StudentTeacher[]> =>
      enabled
        ? teacherLinks.listStudentTeachers(studentId)
        : Promise.resolve([]),
    [teacherLinks, studentId, enabled],
  );
  const { resource, reload, refresh } = useResource(load);

  /** Primer paso: pedir confirmación (pierde el acceso al estudiante). */
  const askRemove = useCallback((teacherId: string) => {
    setMessage(null);
    setConfirmingId(teacherId);
  }, []);

  const cancelRemove = useCallback(() => setConfirmingId(null), []);

  /** Segundo paso: quitarla y actualizar sin ocultar lo que se ve. */
  const confirmRemove = useCallback(
    async (teacher: StudentTeacher) => {
      setBusyId(teacher.teacherId);
      try {
        const result = await teacherLinks.removeTeacher(
          studentId,
          teacher.teacherId,
        );
        // `notInCharge`: alguien la quitó antes. No es un error: se recarga
        // y la sección muestra cómo quedó.
        setMessage(
          result === 'removed'
            ? { tone: 'done', text: `Quitaste a ${teacher.displayName}.` }
            : null,
        );
        refresh();
      } catch (error) {
        const text = removeTeacherErrorText(error);
        setMessage({ tone: 'error', text });
        // La región en vivo solo funciona en Android: se anuncia también.
        AccessibilityInfo.announceForAccessibility(text);
      } finally {
        setBusyId(null);
        setConfirmingId(null);
      }
    },
    [teacherLinks, studentId, refresh],
  );

  const showAssignedNotice = useCallback(() => {
    setMessage({ tone: 'done', text: 'Tallerista asignada' });
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

export type StudentTeachers = ReturnType<typeof useStudentTeachers>;
