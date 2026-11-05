import type {
  Pagina,
  Paginacion,
} from '../../../common/paginacion/paginacion.js';
import type { Configuracion } from '../../catalogo/domain/juegos/estrategia-juego.js';
import type { AlcanceEstudiantes } from '../../estudiantes/domain/alcance.js';
import type {
  Actividad,
  Contenido,
  ElementoActividad,
  Modulo,
  TipoContenido,
} from './modulo.entity.js';

/** Qué módulos ve un adulto en el listado. */
export type VisibilidadModulos =
  | { tipo: 'todos' }
  /** Publicados + los que creó la tallerista. */
  | { tipo: 'tallerista'; talleristaId: bigint };

export interface FiltroModulos {
  categoriaId: bigint | null;
  nivelId: bigint | null;
  publicado: boolean | null;
}

export interface DatosModulo {
  categoriaId: bigint;
  nivelId: bigint;
  musicaId: bigint | null;
  nombre: string;
  descripcion: string | null;
  orden: number;
}

/** null = no cambiar; 'borrar' = dejar el campo vacío (música, descripción, portada). */
export interface CambiosModulo {
  categoriaId: bigint | null;
  nivelId: bigint | null;
  musicaId: bigint | null | 'borrar';
  nombre: string | null;
  descripcion: string | null | 'borrar';
  portadaContenidoId: bigint | null | 'borrar';
  orden: number | null;
}

export interface ModuloRepository {
  buscarPorId(id: bigint): Promise<Modulo | null>;
  listar(
    visibilidad: VisibilidadModulos,
    filtro: FiltroModulos,
    paginacion: Paginacion,
  ): Promise<Pagina<Modulo>>;
  crear(datos: DatosModulo, creadoPor: bigint): Promise<Modulo>;
  actualizar(id: bigint, cambios: CambiosModulo): Promise<Modulo>;
  cambiarPublicado(id: bigint, publicado: boolean): Promise<Modulo>;
  /** Borra el módulo con sus contenidos y actividades (cascada en la base). */
  eliminar(id: bigint): Promise<void>;
  tieneAsignaciones(id: bigint): Promise<boolean>;
  contarActividadesActivas(id: bigint): Promise<number>;
  /** ¿El módulo está asignado a algún estudiante del alcance? */
  asignadoEnAlcance(
    alcance: AlcanceEstudiantes,
    moduloId: bigint,
  ): Promise<boolean>;
}

export interface ContenidoRepository {
  listar(moduloId: bigint): Promise<Contenido[]>;
  buscarPorId(id: bigint): Promise<Contenido | null>;
  crear(datos: {
    moduloId: bigint;
    tipo: TipoContenido;
    titulo: string;
    ruta: string;
    orden: number;
  }): Promise<Contenido>;
  actualizar(
    id: bigint,
    cambios: { titulo: string | null; orden: number | null },
  ): Promise<Contenido>;
  eliminar(id: bigint): Promise<void>;
  /** ¿Lo usa alguna actividad (como contenido, imagen, kinema o audio) o es la portada? */
  estaEnUso(contenido: Contenido): Promise<boolean>;
}

export interface DatosActividad {
  tipoJuegoId: bigint;
  titulo: string;
  instruccionTexto: string | null;
  configuracion: Configuracion;
  orden: number;
  activa: boolean;
}

export interface CambiosActividad {
  titulo: string | null;
  instruccionTexto: string | null | 'borrar';
  configuracion: Configuracion | null;
  orden: number | null;
  activa: boolean | null;
}

export interface ActividadRepository {
  listar(moduloId: bigint, soloActivas: boolean): Promise<Actividad[]>;
  buscarPorId(id: bigint): Promise<Actividad | null>;
  elementos(actividadId: bigint): Promise<ElementoActividad[]>;
  crear(moduloId: bigint, datos: DatosActividad): Promise<Actividad>;
  actualizar(id: bigint, cambios: CambiosActividad): Promise<Actividad>;
  eliminar(id: bigint): Promise<void>;
  tieneIntentos(id: bigint): Promise<boolean>;
  /** Reemplaza todos los elementos de la actividad en una transacción. */
  reemplazarElementos(
    actividadId: bigint,
    elementos: ElementoActividad[],
  ): Promise<ElementoActividad[]>;
}

export const MODULO_REPOSITORY = Symbol('MODULO_REPOSITORY');
export const CONTENIDO_REPOSITORY = Symbol('CONTENIDO_REPOSITORY');
export const ACTIVIDAD_REPOSITORY = Symbol('ACTIVIDAD_REPOSITORY');
