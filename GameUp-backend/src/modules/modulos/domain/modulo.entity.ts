import type { TipoMime } from '../../../common/almacenamiento/tipos-archivo.js';
import type { PersonaResumen } from '../../estudiantes/domain/estudiante.entity.js';
import type {
  CodigoJuego,
  Configuracion,
} from '../../catalogo/domain/juegos/estrategia-juego.js';

export interface Referencia {
  id: bigint;
  nombre: string;
}

export interface PropiedadesModulo {
  id: bigint;
  categoria: Referencia;
  nivel: Referencia;
  creadoPor: PersonaResumen;
  musicaId: bigint | null;
  nombre: string;
  descripcion: string | null;
  /** Contenido IMAGEN del mismo módulo que sirve de portada. */
  portadaContenidoId: bigint | null;
  publicado: boolean;
  orden: number;
  creadoEn: Date;
}

/** Módulo educativo: raíz del agregado (contenidos y actividades). */
export class Modulo {
  readonly id: bigint;
  readonly categoria: Referencia;
  readonly nivel: Referencia;
  readonly creadoPor: PersonaResumen;
  readonly musicaId: bigint | null;
  readonly nombre: string;
  readonly descripcion: string | null;
  readonly portadaContenidoId: bigint | null;
  readonly publicado: boolean;
  readonly orden: number;
  readonly creadoEn: Date;

  constructor(p: PropiedadesModulo) {
    this.id = p.id;
    this.categoria = p.categoria;
    this.nivel = p.nivel;
    this.creadoPor = p.creadoPor;
    this.musicaId = p.musicaId;
    this.nombre = p.nombre;
    this.descripcion = p.descripcion;
    this.portadaContenidoId = p.portadaContenidoId;
    this.publicado = p.publicado;
    this.orden = p.orden;
    this.creadoEn = p.creadoEn;
  }

  esAutor(usuarioId: bigint): boolean {
    return this.creadoPor.id === usuarioId;
  }
}

export const TIPOS_CONTENIDO = [
  'VIDEO',
  'IMAGEN',
  'AUDIO',
  'ANIMACION',
] as const;
export type TipoContenido = (typeof TIPOS_CONTENIDO)[number];

/** Formatos aceptados por tipo de contenido (dentro de lo que admite el bucket). */
export const FORMATOS_POR_TIPO: Record<TipoContenido, readonly TipoMime[]> = {
  VIDEO: ['video/mp4'],
  IMAGEN: ['image/png', 'image/jpeg', 'image/webp'],
  AUDIO: ['audio/mpeg', 'audio/mp4'],
  ANIMACION: ['video/mp4', 'image/webp'],
};

/** Archivo de un módulo en el bucket privado `contenidos`. */
export interface Contenido {
  id: bigint;
  moduloId: bigint;
  tipo: TipoContenido;
  titulo: string;
  /** Ruta en Storage: modulo/<id>/contenido/<uuid>.<ext>. Nunca sale de la API. */
  ruta: string;
  orden: number;
}

export interface Actividad {
  id: bigint;
  moduloId: bigint;
  tipoJuego: { id: bigint; codigo: CodigoJuego; nombre: string };
  titulo: string;
  instruccionTexto: string | null;
  configuracion: Configuracion;
  orden: number;
  activa: boolean;
}

/**
 * Un contenido usado en una actividad (tabla actividad_contenido). Las
 * imágenes, kinemas y audios se refieren a contenidos del MISMO módulo.
 */
export interface ElementoActividad {
  contenidoId: bigint;
  rolEnJuego: string | null;
  orden: number;
  palabra: string | null;
  /** Obligatoria en la base (url_imagen). */
  imagenContenidoId: bigint | null;
  kinemaContenidoId: bigint | null;
  audioContenidoId: bigint | null;
}

/** Máximo de contenidos por actividad. */
export const MAXIMO_ELEMENTOS = 50;

/** Tipos de contenido válidos para cada referencia de un elemento. */
export const TIPOS_REFERENCIA = {
  imagen: ['IMAGEN'],
  kinema: ['IMAGEN', 'ANIMACION', 'VIDEO'],
  audio: ['AUDIO'],
} as const satisfies Record<string, readonly TipoContenido[]>;
