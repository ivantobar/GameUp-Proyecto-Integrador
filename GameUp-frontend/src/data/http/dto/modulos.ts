/**
 * DTO del módulo `modulos` del backend (`GameUp-backend/src/modules/
 * modulos/presentation/dto/modulo.dto.ts`).
 */
import type { NivelDto } from './estudiantes';

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
