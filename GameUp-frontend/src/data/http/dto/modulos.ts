/**
 * DTO del módulo `modulos` del backend (`GameUp-backend/src/modules/
 * modulos/presentation/dto/modulo.dto.ts`).
 */
import type { NivelDto } from './estudiantes';
import type { CodigoJuego } from './juegos';

/** Un módulo de `GET /modulos`. */
export interface ModuloDto {
  id: string;
  nombre: string;
  descripcion: string | null;
  /** Categoría `{ id, nombre }`. */
  categoria: NivelDto;
  nivel: NivelDto;
  creadoPor: { id: string; displayName: string };
  musicaId: string | null;
  portadaContenidoId: string | null;
  /** Solo los publicados se pueden asignar. */
  publicado: boolean;
  orden: number;
  creadoEn: string;
}

/** Respuesta de `GET /modulos`. */
export interface PaginaModulosDto {
  items: ModuloDto[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Un elemento de `GET /modulos/:id/actividades` (arreglo, ordenado por
 * `orden`). A la tallerista y la directora también les llegan las
 * inactivas (`activa: false`).
 */
export interface ActividadModuloDto {
  id: string;
  moduloId: string;
  tipoJuego: { id: string; codigo: CodigoJuego; nombre: string };
  titulo: string;
  instruccionTexto: string | null;
  configuracion: Record<string, unknown>;
  orden: number;
  activa: boolean;
  /** Nivel de la escalera (1-5); `null` en las actividades de un módulo. */
  nivelJuego: number | null;
}
