/**
 * Días de práctica en casa (tabla practica_casa). Las fechas viajan como
 * "AAAA-MM-DD" (hora de Bogotá): el adaptador las convierte para la columna date.
 */
export interface PracticaCasaRepository {
  /**
   * Idempotente: marcar dos veces el mismo día no duplica. Los triggers
   * exigen el rol ACUDIENTE y el vínculo con el estudiante.
   */
  registrar(
    estudianteId: bigint,
    acudienteId: bigint,
    fecha: string,
  ): Promise<void>;
  /** Días distintos con práctica entre `desde` y `hasta` (inclusive), de cualquier acudiente. */
  diasPracticados(
    estudianteId: bigint,
    desde: string,
    hasta: string,
  ): Promise<string[]>;
}

export const PRACTICA_CASA_REPOSITORY = Symbol('PRACTICA_CASA_REPOSITORY');
