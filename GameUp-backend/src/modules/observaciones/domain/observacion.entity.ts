import { ReglaNegocioError } from '../../../common/errors/dominio.errors.js';
import type { PersonaResumen } from '../../estudiantes/domain/estudiante.entity.js';

export const LARGO_MAXIMO_OBSERVACION = 1000;

export interface PropiedadesObservacion {
  id: bigint;
  estudianteId: bigint;
  /** Directora o tallerista que la escribió. */
  autor: PersonaResumen;
  texto: string;
  /** true: la ve el acudiente (y la base le envía una notificación). */
  visibleAcudiente: boolean;
  fecha: Date;
}

/** Seguimiento escrito sobre un estudiante (tabla observacion). */
export class Observacion {
  readonly id: bigint;
  readonly estudianteId: bigint;
  readonly autor: PersonaResumen;
  readonly texto: string;
  readonly visibleAcudiente: boolean;
  readonly fecha: Date;

  constructor(p: PropiedadesObservacion) {
    this.id = p.id;
    this.estudianteId = p.estudianteId;
    this.autor = p.autor;
    this.texto = p.texto;
    this.visibleAcudiente = p.visibleAcudiente;
    this.fecha = p.fecha;
  }

  esDe(usuarioId: bigint): boolean {
    return this.autor.id === usuarioId;
  }
}

/**
 * Quita los espacios de los extremos (conserva los saltos de línea del
 * cuerpo). Vacía o demasiado larga → 422. La base también exige que no
 * quede vacía (observacion_texto_check).
 */
export function normalizarTextoObservacion(texto: string): string {
  const limpio = texto.trim();
  if (!limpio) {
    throw new ReglaNegocioError('La observación no puede quedar vacía.');
  }
  if (limpio.length > LARGO_MAXIMO_OBSERVACION) {
    throw new ReglaNegocioError(
      `La observación admite hasta ${LARGO_MAXIMO_OBSERVACION} caracteres.`,
    );
  }
  return limpio;
}
