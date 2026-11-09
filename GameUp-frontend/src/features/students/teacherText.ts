import { spokenDate } from '@/data/bogotaDate';
import { StudentAccessError, TeacherLinkError } from '@/data/studentErrors';
import type { StudentTeacher } from '@/data/types';

/** «Desde el 5 de noviembre». */
export function teacherSinceText(teacher: StudentTeacher): string {
  return `Desde el ${spokenDate(teacher.since)}`;
}

/** Mensaje claro cuando no se pudo asignar una tallerista. */
export function assignTeacherErrorText(error: unknown): string {
  if (error instanceof TeacherLinkError) {
    return error.problem === 'alreadyInCharge'
      ? 'Ya lo tiene a cargo.'
      : 'Esa cuenta no es de una tallerista activa.';
  }
  if (error instanceof StudentAccessError) {
    return 'No puedes cambiar la tallerista de este estudiante.';
  }
  return 'No se pudo asignar. Revisa la conexión e inténtalo otra vez.';
}

/** Mensaje claro cuando no se pudo quitar una tallerista. */
export function removeTeacherErrorText(error: unknown): string {
  if (error instanceof StudentAccessError) {
    return 'No puedes cambiar la tallerista de este estudiante.';
  }
  return 'No se pudo quitar. Revisa la conexión e inténtalo otra vez.';
}
