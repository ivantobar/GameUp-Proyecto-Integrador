import type { CodigoJuego } from './juegos/estrategia-juego.js';

/** Entidades de catálogo: solo lectura desde la API (se cargan por migración). */
export interface Nivel {
  id: bigint;
  nombre: string;
  descripcion: string | null;
  orden: number;
}

export interface Categoria {
  id: bigint;
  nombre: string;
  descripcion: string | null;
  iconoUrl: string | null;
}

export interface TipoJuego {
  id: bigint;
  codigo: CodigoJuego;
  nombre: string;
  descripcion: string | null;
}

export interface Musica {
  id: bigint;
  titulo: string;
  autor: string | null;
  tipo: 'CLASICA' | 'INFANTIL';
  urlAudio: string;
  activa: boolean;
}

/** Puerto de lectura del catálogo. */
export interface CatalogoRepository {
  niveles(): Promise<Nivel[]>;
  categorias(): Promise<Categoria[]>;
  tiposJuego(): Promise<TipoJuego[]>;
  musica(soloActiva: boolean): Promise<Musica[]>;
  existeNivel(id: bigint): Promise<boolean>;
  existeCategoria(id: bigint): Promise<boolean>;
  existeMusicaActiva(id: bigint): Promise<boolean>;
  tipoJuegoPorCodigo(codigo: CodigoJuego): Promise<TipoJuego | null>;
}

export const CATALOGO_REPOSITORY = Symbol('CATALOGO_REPOSITORY');
