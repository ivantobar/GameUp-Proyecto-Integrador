import type {
  Pagina,
  Paginacion,
} from '../../../common/paginacion/paginacion.js';
import type { EstadoEstudiante } from '../../usuarios/domain/usuario.entity.js';
import type { AlcanceEstudiantes } from './alcance.js';
import type {
  CambioNivel,
  Estudiante,
  TalleristaAsignada,
  VinculoAcudiente,
} from './estudiante.entity.js';

export interface FiltroEstudiantes {
  estado: EstadoEstudiante | null;
  nivelId: bigint | null;
}

/** Lectura de estudiantes, siempre acotada por el alcance de quien pide. */
export interface EstudianteLecturaRepository {
  buscarPorId(id: bigint): Promise<Estudiante | null>;
  listar(
    alcance: AlcanceEstudiantes,
    filtro: FiltroEstudiantes,
    paginacion: Paginacion,
  ): Promise<Pagina<Estudiante>>;
  /** ¿El estudiante existe y está dentro del alcance? */
  estaEnAlcance(
    alcance: AlcanceEstudiantes,
    estudianteId: bigint,
  ): Promise<boolean>;
  historialNivel(
    estudianteId: bigint,
    paginacion: Paginacion,
  ): Promise<Pagina<CambioNivel>>;
}

/** Cambio de nivel (función cambiar_nivel de la base: historial + notificación). */
export interface NivelEstudianteRepository {
  cambiarNivel(
    estudianteId: bigint,
    nivelId: bigint,
    directoraId: bigint,
    motivo: string | null,
  ): Promise<void>;
}

/** Vínculo tallerista ⇄ estudiante. */
export interface TalleristaEstudianteRepository {
  listar(estudianteId: bigint): Promise<TalleristaAsignada[]>;
  buscar(
    talleristaId: bigint,
    estudianteId: bigint,
  ): Promise<TalleristaAsignada | null>;
  /** Crea el vínculo o reactiva uno anterior, con fecha_inicio = `desde`. */
  activar(
    talleristaId: bigint,
    estudianteId: bigint,
    desde: Date,
  ): Promise<TalleristaAsignada>;
  /** activo = false. Devuelve false si no había un vínculo activo. */
  desactivar(talleristaId: bigint, estudianteId: bigint): Promise<boolean>;
}

/** Vínculo acudiente ⇄ estudiante (copia del de la API del núcleo familiar). */
export interface AcudienteEstudianteRepository {
  listar(estudianteId: bigint): Promise<VinculoAcudiente[]>;
  buscar(
    acudienteId: bigint,
    estudianteId: bigint,
  ): Promise<VinculoAcudiente | null>;
  crear(
    acudienteId: bigint,
    estudianteId: bigint,
    parentesco: string,
    esPrincipal: boolean,
  ): Promise<VinculoAcudiente>;
  /**
   * Cambia parentesco y/o principal. Si se marca como principal, quita esa
   * marca a los demás acudientes del estudiante en la misma transacción.
   */
  actualizar(
    acudienteId: bigint,
    estudianteId: bigint,
    cambios: { parentesco: string | null; esPrincipal: boolean | null },
  ): Promise<VinculoAcudiente>;
  /** Devuelve false si no existía. */
  eliminar(acudienteId: bigint, estudianteId: bigint): Promise<boolean>;
}

export const ESTUDIANTE_LECTURA_REPOSITORY = Symbol(
  'ESTUDIANTE_LECTURA_REPOSITORY',
);
export const NIVEL_ESTUDIANTE_REPOSITORY = Symbol(
  'NIVEL_ESTUDIANTE_REPOSITORY',
);
export const TALLERISTA_ESTUDIANTE_REPOSITORY = Symbol(
  'TALLERISTA_ESTUDIANTE_REPOSITORY',
);
export const ACUDIENTE_ESTUDIANTE_REPOSITORY = Symbol(
  'ACUDIENTE_ESTUDIANTE_REPOSITORY',
);
