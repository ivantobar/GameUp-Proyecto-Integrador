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

/** `ESTADOS_ASIGNACION` del backend. */
export type EstadoAsignacion = 'ASIGNADO' | 'EN_CURSO' | 'COMPLETADO';

/** Cuerpo de `POST /asignaciones` (`CrearAsignacionDto`). */
export interface CrearAsignacionDto {
  moduloId: string;
  estudianteId: string;
  /** AAAA-MM-DD, no antes de hoy en hora de Bogotá. */
  fechaSugerida?: string;
}

/** `EstudianteAsignadoDto`. */
export interface EstudianteAsignadoDto {
  id: string;
  displayName: string;
  initials: string;
}

/** Una asignación de `GET /asignaciones` o la respuesta de `POST /asignaciones`. */
export interface AsignacionDto {
  id: string;
  /** Módulo `{ id, nombre }`. */
  modulo: NivelDto;
  estudiante: EstudianteAsignadoDto;
  asignadoPor: { id: string; displayName: string };
  fechaAsignacion: string;
  fechaSugerida: string | null;
  estado: EstadoAsignacion;
  /** 0 a 100: solo actividades activas con validación APROBADO. */
  progreso: number;
}

/** Respuesta de `GET /asignaciones`. */
export interface PaginaAsignacionesDto {
  items: AsignacionDto[];
  total: number;
  page: number;
  limit: number;
}
