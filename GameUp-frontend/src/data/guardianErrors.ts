/**
 * El acudiente todavía no tiene niños vinculados. No es un problema de
 * conexión: la pantalla muestra un estado vacío amable, no «Revisa la
 * conexión». Lo lanzan igual la versión simulada y la de la API.
 */
export class NoLinkedStudentsError extends Error {
  constructor() {
    super('Este acudiente no tiene estudiantes asociados');
    this.name = 'NoLinkedStudentsError';
  }
}
