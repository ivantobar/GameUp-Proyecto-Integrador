/**
 * DTO del módulo `asignaciones` del backend (`GameUp-backend/src/modules/
 * asignaciones/presentation/dto/asignacion.dto.ts`).
 */
import type { NivelDto } from './estudiantes';
import type { CodigoJuego, EstadoActividad } from './juegos';

/** Una actividad de `GET /estudiantes/me/actividades-pendientes`. */
export interface ActividadPendienteDto {
  actividadId: string;
  titulo: string;
  tipoJuego: CodigoJuego;
  orden: number;
  /** Solo en Habla conmigo. */
  vocal: string | null;
  estado: EstadoActividad;
  intentos: number;
  /** Aún no tiene intentos. */
  esNueva: boolean;
  retroalimentacion: string | null;
  asignacionId: string;
  /** Módulo `{ id, nombre }`. */
  modulo: NivelDto;
  fechaSugerida: string | null;
}

/** Un módulo de `GET /estudiantes/me/progreso`. */
export interface ProgresoModuloDto {
  asignacionId: string;
  modulo: NivelDto;
  estado: 'ASIGNADO' | 'EN_CURSO' | 'COMPLETADO';
  /** 0 a 100: solo actividades con validación APROBADO. */
  progreso: number;
  validadas: number;
  total: number;
  pendientesValidacion: number;
}

/** Respuesta de `GET /estudiantes/me/progreso`. */
export interface ProgresoOficialDto {
  modulos: ProgresoModuloDto[];
  pendientesValidacion: number;
}
