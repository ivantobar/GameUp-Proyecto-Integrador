import { ReglaNegocioError } from '../../../common/errors/dominio.errors.js';
import type {
  CodigoJuego,
  Configuracion,
} from '../../catalogo/domain/juegos/estrategia-juego.js';
import type { PersonaResumen } from '../../estudiantes/domain/estudiante.entity.js';

export const RESULTADOS_VALIDACION = ['APROBADO', 'RECHAZADO'] as const;
export type ResultadoValidacion = (typeof RESULTADOS_VALIDACION)[number];

export interface DecisionValidacion {
  resultado: ResultadoValidacion;
  retroalimentacion: string | null;
}

export const LARGO_MAXIMO_RETROALIMENTACION = 500;
/** Máximo de intentos por aprobación en lote. */
export const MAXIMO_LOTE = 50;
/** Las grabaciones nunca validadas se borran a los 30 días (decidido en la fase 0). */
export const PLAZO_GRABACION_DIAS = 30;

/**
 * «Lo logró» (APROBADO) o «Practicar más» (RECHAZADO). Para rechazar, la
 * retroalimentación es obligatoria: es lo que verán el niño y su familia.
 */
export function normalizarDecision(
  resultado: ResultadoValidacion,
  retroalimentacion: string | null,
): DecisionValidacion {
  const texto = retroalimentacion?.trim().replace(/\s+/g, ' ') || null;
  if (resultado === 'RECHAZADO' && !texto) {
    throw new ReglaNegocioError(
      'Para pedir que practique más, la retroalimentación es obligatoria.',
    );
  }
  if (texto && texto.length > LARGO_MAXIMO_RETROALIMENTACION) {
    throw new ReglaNegocioError(
      `La retroalimentación admite hasta ${LARGO_MAXIMO_RETROALIMENTACION} caracteres.`,
    );
  }
  return { resultado, retroalimentacion: texto };
}

/** Un intento que espera la revisión de la tallerista («Por escuchar»). */
export interface ItemRevision {
  intentoId: bigint;
  numeroIntento: number;
  fecha: Date;
  tipoJuego: CodigoJuego;
  resultado: Configuracion;
  estudiante: PersonaResumen;
  actividad: { id: bigint; titulo: string; vocal: string | null };
  modulo: { id: bigint; nombre: string };
  /** Intentos pendientes de la misma actividad y asignación (este incluido). */
  pendientesMismaActividad: number;
  /**
   * Solo si se guardó audio. `disponible`: aún se puede escuchar.
   * `vencido`: se borró por el plazo de 30 días sin validar.
   */
  grabacion: { disponible: boolean; vencido: boolean } | null;
}

/** Una grabación guardada (tabla grabacion_estudiante). */
export interface GrabacionGuardada {
  id: bigint;
  intentoId: bigint;
  /** Ruta en el bucket privado `grabaciones`. Nunca sale de la API ni de los logs. */
  ruta: string;
  creadaEn: Date;
  eliminadaEn: Date | null;
}
