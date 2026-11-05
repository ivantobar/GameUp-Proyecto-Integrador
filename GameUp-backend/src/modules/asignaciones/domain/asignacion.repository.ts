import type {
  Pagina,
  Paginacion,
} from '../../../common/paginacion/paginacion.js';
import type { AlcanceEstudiantes } from '../../estudiantes/domain/alcance.js';
import type {
  Asignacion,
  EstadoAsignacion,
  IntentoResumen,
} from './asignacion.entity.js';

export interface FiltroAsignaciones {
  estudianteId: bigint | null;
  moduloId: bigint | null;
  estado: EstadoAsignacion | null;
}

export interface NuevaAsignacion {
  moduloId: bigint;
  estudianteId: bigint;
  asignadoPor: bigint;
  fechaSugerida: Date | null;
}

/** Lectura de asignaciones, acotada por el alcance de quien pide. */
export interface AsignacionLecturaRepository {
  buscarPorId(id: bigint): Promise<Asignacion | null>;
  listar(
    alcance: AlcanceEstudiantes,
    filtro: FiltroAsignaciones,
    paginacion: Paginacion,
  ): Promise<Pagina<Asignacion>>;
  /** Las que no están COMPLETADO, sin paginar (las del propio estudiante). */
  activasDelEstudiante(estudianteId: bigint): Promise<Asignacion[]>;
  /** ¿Ya hay una sin completar de ese módulo para ese estudiante? */
  existeActiva(moduloId: bigint, estudianteId: bigint): Promise<boolean>;
  /** Intentos (con su validación) de una o varias asignaciones. */
  intentos(asignacionIds: bigint[]): Promise<Map<bigint, IntentoResumen[]>>;
}

/** Escritura de asignaciones. */
export interface AsignacionEscrituraRepository {
  /** La base avisa a los acudientes (NUEVO_MODULO) y hace cumplir rol, vínculo y publicación. */
  crear(datos: NuevaAsignacion): Promise<Asignacion>;
  eliminar(id: bigint): Promise<void>;
}

export const ASIGNACION_LECTURA_REPOSITORY = Symbol(
  'ASIGNACION_LECTURA_REPOSITORY',
);
export const ASIGNACION_ESCRITURA_REPOSITORY = Symbol(
  'ASIGNACION_ESCRITURA_REPOSITORY',
);
