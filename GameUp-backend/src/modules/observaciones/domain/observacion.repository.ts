import type {
  Pagina,
  Paginacion,
} from '../../../common/paginacion/paginacion.js';
import type { Observacion } from './observacion.entity.js';

export interface NuevaObservacion {
  estudianteId: bigint;
  autorId: bigint;
  texto: string;
  visibleAcudiente: boolean;
}

/** null: no cambia. */
export interface CambiosObservacion {
  texto: string | null;
  visibleAcudiente: boolean | null;
}

/** Lectura de observaciones de un estudiante, de la más reciente a la más antigua. */
export interface ObservacionLecturaRepository {
  buscarPorId(id: bigint): Promise<Observacion | null>;
  listar(
    estudianteId: bigint,
    soloVisiblesAcudiente: boolean,
    paginacion: Paginacion,
  ): Promise<Pagina<Observacion>>;
}

/**
 * Escritura. Los triggers de la base exigen el rol (DIRECTORA/TALLERISTA) y el
 * vínculo del autor con el estudiante, y avisan a los acudientes cuando la
 * observación pasa a ser visible para ellos.
 */
export interface ObservacionEscrituraRepository {
  crear(datos: NuevaObservacion): Promise<Observacion>;
  actualizar(id: bigint, cambios: CambiosObservacion): Promise<Observacion>;
}

export const OBSERVACION_LECTURA_REPOSITORY = Symbol(
  'OBSERVACION_LECTURA_REPOSITORY',
);
export const OBSERVACION_ESCRITURA_REPOSITORY = Symbol(
  'OBSERVACION_ESCRITURA_REPOSITORY',
);
