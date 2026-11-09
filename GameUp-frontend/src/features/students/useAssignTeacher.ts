import { useCallback, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import type { StaffProfile } from '@/data/types';
import { assignTeacherErrorText } from './teacherText';

export interface TeacherChoice {
  teacher: StaffProfile;
  /** Ya lo tiene a cargo: no se puede volver a asignar. */
  alreadyInCharge: boolean;
}

/**
 * «Asignar tallerista» (solo la directora): las talleristas activas para
 * elegir, marcando las que ya lo tienen a cargo, y la acción de asignar.
 */
export function useAssignTeacher(studentId: string) {
  const { teacherLinks } = useRepositories();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (): Promise<TeacherChoice[]> => {
    const [teachers, current] = await Promise.all([
      teacherLinks.listActiveTeachers(),
      teacherLinks.listStudentTeachers(studentId),
    ]);
    const inCharge = new Set(
      current.filter((t) => t.active).map((t) => t.teacherId),
    );
    return teachers.map((teacher) => ({
      teacher,
      alreadyInCharge: inCharge.has(teacher.id),
    }));
  }, [teacherLinks, studentId]);

  const { resource, reload, refresh } = useResource(load);

  /** Devuelve `true` si quedó asignada. */
  const assign = useCallback(
    async (teacherId: string): Promise<boolean> => {
      setSubmitting(true);
      setError(null);
      try {
        await teacherLinks.assignTeacher(studentId, teacherId);
        return true;
      } catch (problem) {
        const text = assignTeacherErrorText(problem);
        setError(text);
        AccessibilityInfo.announceForAccessibility(text);
        // Otra persona pudo asignarla mientras tanto: se actualiza la lista.
        refresh();
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [teacherLinks, studentId, refresh],
  );

  return { resource, reload, error, submitting, assign };
}
