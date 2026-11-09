/**
 * Aviso «Actividad asignada» que la pantalla de asignar deja para el
 * detalle del estudiante al volver. Vive en memoria y se lee una sola vez.
 */
const pending = new Set<string>();

export function leaveAssignedNotice(studentId: string): void {
  pending.add(studentId);
}

/** `true` (una sola vez) si acaban de asignarle una actividad. */
export function takeAssignedNotice(studentId: string): boolean {
  return pending.delete(studentId);
}

/** Aviso «Tallerista asignada» al volver de elegir una tallerista. */
const teacherPending = new Set<string>();

export function leaveTeacherNotice(studentId: string): void {
  teacherPending.add(studentId);
}

/** `true` (una sola vez) si acaban de asignarle una tallerista. */
export function takeTeacherNotice(studentId: string): boolean {
  return teacherPending.delete(studentId);
}
