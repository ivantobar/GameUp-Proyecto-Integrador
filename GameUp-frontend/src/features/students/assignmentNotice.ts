/**
 * Aviso «¡Listo! La actividad … quedó asignada» que la pantalla de asignar
 * deja para el detalle del estudiante al volver. Guarda el nombre del
 * módulo; vive en memoria y se lee una sola vez.
 */
const pending = new Map<string, string>();

export function leaveAssignedNotice(
  studentId: string,
  moduleTitle: string,
): void {
  pending.set(studentId, moduleTitle);
}

/**
 * El módulo que acaban de asignarle (una sola vez), o `null` si no hay
 * aviso pendiente.
 */
export function takeAssignedNotice(studentId: string): string | null {
  const title = pending.get(studentId);
  if (title === undefined) return null;
  pending.delete(studentId);
  return title;
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

/** Aviso «Memoria quedó en el nivel 2.» al volver de «Cambiar nivel». */
const levelPending = new Map<string, string>();

export function leaveLevelNotice(studentId: string, text: string): void {
  levelPending.set(studentId, text);
}

/** El texto del aviso (una sola vez), o `null` si no hay. */
export function takeLevelNotice(studentId: string): string | null {
  const text = levelPending.get(studentId);
  if (text === undefined) return null;
  levelPending.delete(studentId);
  return text;
}
