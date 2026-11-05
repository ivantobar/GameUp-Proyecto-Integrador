import type {
  Pagina,
  Paginacion,
} from '../../../common/paginacion/paginacion.js';
import type {
  DecisionValidacion,
  GrabacionGuardada,
  ItemRevision,
} from './validacion.js';

/** De qué estudiantes ve la bandeja quien revisa. */
export type AlcanceRevision =
  { tipo: 'todos' } | { tipo: 'tallerista'; talleristaId: bigint };

/** Bandeja «Por escuchar»: intentos sin validación. */
export interface RevisionLecturaRepository {
  pendientes(
    alcance: AlcanceRevision,
    estudianteId: bigint | null,
    paginacion: Paginacion,
  ): Promise<Pagina<ItemRevision>>;
}

/** Validaciones (la base recalcula el progreso y avisa a los acudientes). */
export interface ValidacionEscrituraRepository {
  /** Los triggers exigen rol y vínculo, y la unicidad impide validar dos veces. */
  validar(
    intentoId: bigint,
    validadorId: bigint,
    decision: DecisionValidacion,
  ): Promise<void>;
  /** Aprueba varios intentos en UNA transacción (todos o ninguno). */
  aprobarLote(intentoIds: bigint[], validadorId: bigint): Promise<number>;
}

/** Grabaciones de voz: entrega y borrado. */
export interface GrabacionRepository {
  buscarPorIntento(intentoId: bigint): Promise<GrabacionGuardada | null>;
  /** Validadas cuyo archivo falta borrar (vista grabacion_por_eliminar). */
  validadasSinBorrar(limite: number): Promise<GrabacionGuardada[]>;
  /** Nunca validadas, creadas antes de `antesDe` y aún no borradas. */
  vencidas(antesDe: Date, limite: number): Promise<GrabacionGuardada[]>;
  /** Marca eliminada_en (solo las que aún no lo tenían). */
  marcarEliminadas(ids: bigint[], fecha: Date): Promise<void>;
}

export const REVISION_LECTURA_REPOSITORY = Symbol(
  'REVISION_LECTURA_REPOSITORY',
);
export const VALIDACION_ESCRITURA_REPOSITORY = Symbol(
  'VALIDACION_ESCRITURA_REPOSITORY',
);
export const GRABACION_REPOSITORY = Symbol('GRABACION_REPOSITORY');
