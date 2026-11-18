/**
 * Errores de las pantallas de estudiantes y asignaciones. Los lanzan igual
 * la versión simulada y la de la API, para que la pantalla muestre un
 * mensaje claro (no «Revisa la conexión») cuando el backend dice que no.
 */

/** El estudiante no existe o no le corresponde a quien pregunta (403 o 404). */
export class StudentAccessError extends Error {
  constructor() {
    super('No puedes ver a este estudiante.');
    this.name = 'StudentAccessError';
  }
}

/**
 * Por qué no se pudo asignar o quitar. El mismo código HTTP significa cosas
 * distintas según el endpoint (409), así que lo decide cada operación:
 * - `alreadyAssigned`: POST 409, ya tiene ese módulo sin terminar;
 * - `notAssignable`: POST 422, módulo sin publicar, estudiante inactivo o
 *   fecha pasada;
 * - `invalid`: 400, datos con formato inválido;
 * - `notAllowed`: 403, su rol no puede hacerlo;
 * - `notFound`: 404, el estudiante, el módulo o la asignación no existen o
 *   no le corresponden;
 * - `hasAttempts`: DELETE 409, el estudiante ya practicó esa asignación.
 */
export type AssignmentProblem =
  | 'alreadyAssigned'
  | 'notAssignable'
  | 'invalid'
  | 'notAllowed'
  | 'notFound'
  | 'hasAttempts';

export class AssignmentError extends Error {
  constructor(readonly problem: AssignmentProblem) {
    super(`No se pudo completar la asignación (${problem}).`);
    this.name = 'AssignmentError';
  }
}

/**
 * Por qué no se pudo poner a un estudiante a cargo de una tallerista:
 * - `alreadyInCharge`: POST 409, esa tallerista ya lo tiene a cargo;
 * - `notActiveTeacher`: POST 422, la cuenta no es de una tallerista activa.
 */
export type TeacherLinkProblem = 'alreadyInCharge' | 'notActiveTeacher';

export class TeacherLinkError extends Error {
  constructor(readonly problem: TeacherLinkProblem) {
    super(`No se pudo asignar la tallerista (${problem}).`);
    this.name = 'TeacherLinkError';
  }
}

/**
 * Por qué no se pudo cambiar a mano el nivel de un juego:
 * - `notAllowed`: 403, su rol no puede (la tallerista solo baja; subir a
 *   mano es de la directora). Lleva el mensaje del backend;
 * - `invalid`: 400 o 422, falta el motivo, nivel fuera de 1-5 o ya va en él;
 * - `changed`: 409, el nivel cambió mientras tanto (una validación).
 */
export type LevelChangeProblem = 'notAllowed' | 'invalid' | 'changed';

export class LevelChangeError extends Error {
  constructor(
    readonly problem: LevelChangeProblem,
    /** Lo que explicó el backend (en español), si lo dijo. */
    readonly detail: string | null = null,
  ) {
    super(`No se pudo cambiar el nivel (${problem}).`);
    this.name = 'LevelChangeError';
  }
}

/** Lo que responde el backend cuando la tallerista intenta subir a mano. */
export const SOLO_DIRECTORA_SUBE =
  'Solo la directora puede subir de nivel a mano. La tallerista lo sube aprobando un intento del nivel actual.';
