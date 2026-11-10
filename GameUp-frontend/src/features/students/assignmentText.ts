import { toPercent } from '@/components/ui';
import { spokenDate } from '@/data/bogotaDate';
import { AssignmentError, StudentAccessError } from '@/data/studentErrors';
import type {
  AssignmentState,
  OfficialProgress,
  StudentAssignment,
} from '@/data/types';

/** Estado de una asignación en palabras (no solo con color). */
export const assignmentStateLabels: Record<AssignmentState, string> = {
  assigned: 'Sin empezar',
  inProgress: 'En curso',
  completed: 'Completado',
};

/** «Vocal A · En curso · 40 % · para el 20 de noviembre». */
export function assignmentSummary(assignment: StudentAssignment): string {
  const parts = [
    assignmentStateLabels[assignment.state],
    `${assignment.progress} %`,
  ];
  if (assignment.suggestedDate) {
    parts.push(`para el ${spokenDate(assignment.suggestedDate)}`);
  }
  return parts.join(' · ');
}

/** Progreso oficial total: actividades validadas sobre el total asignado. */
export function overallPercent(progress: OfficialProgress): number {
  const validated = progress.modules.reduce((sum, m) => sum + m.validated, 0);
  const total = progress.modules.reduce((sum, m) => sum + m.total, 0);
  return toPercent(validated, total);
}

/** Mensaje claro cuando no se pudo asignar. */
export function assignErrorText(error: unknown): string {
  if (!(error instanceof AssignmentError)) {
    return 'No se pudo asignar. Revisa la conexión e inténtalo otra vez.';
  }
  switch (error.problem) {
    case 'alreadyAssigned':
      return 'Ese módulo ya está asignado y sin terminar.';
    case 'notAssignable':
      return 'No se puede asignar: el módulo no está publicado o la fecha ya pasó.';
    case 'invalid':
      return 'Revisa la fecha sugerida e inténtalo otra vez.';
    case 'notAllowed':
      return 'Tu cuenta no puede asignar actividades.';
    case 'notFound':
      return 'No encontramos a este estudiante o ese módulo.';
    case 'hasAttempts':
      return 'Ya empezó a practicarla; no se puede quitar.';
  }
}

/** Mensaje claro cuando no se pudo quitar una asignación. */
export function removeErrorText(error: unknown): string {
  if (!(error instanceof AssignmentError)) {
    return 'No se pudo quitar. Revisa la conexión e inténtalo otra vez.';
  }
  switch (error.problem) {
    case 'hasAttempts':
      return 'Ya empezó a practicarla; no se puede quitar.';
    case 'notAllowed':
      return 'Tu cuenta no puede quitar asignaciones.';
    case 'notFound':
      return 'Esa asignación ya no existe.';
    default:
      return 'No se pudo quitar. Inténtalo otra vez.';
  }
}

/** ¿El error al cargar es de permisos (no de conexión)? */
export function isAccessError(error: unknown): boolean {
  return (
    error instanceof StudentAccessError ||
    (error instanceof AssignmentError &&
      (error.problem === 'notAllowed' || error.problem === 'notFound'))
  );
}

/** «Trae 1 actividad» / «Trae 10 actividades» (antes de asignar un módulo). */
export function moduleActivitiesTitle(count: number): string {
  return count === 1 ? 'Trae 1 actividad' : `Trae ${count} actividades`;
}
