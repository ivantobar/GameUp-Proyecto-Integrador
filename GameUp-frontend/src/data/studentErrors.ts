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
