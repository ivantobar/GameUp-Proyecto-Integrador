/**
 * DTO del espacio del acudiente: práctica en casa, observaciones y la lista
 * de sus estudiantes (`GameUp-backend/src/modules/practica-casa`,
 * `observaciones` y `estudiantes`).
 */
import type { ActividadPendienteDto } from './asignaciones';

/** `{ id, displayName, initials }` de un estudiante. */
export interface EstudianteResumenDto {
  id: string;
  /** Nombre y la inicial del apellido («Martín C.»). */
  displayName: string;
  initials: string;
}

/** Respuesta de `GET /estudiantes` (el acudiente recibe solo los suyos). */
export interface PaginaEstudiantesDto {
  items: EstudianteResumenDto[];
  total: number;
  page: number;
  limit: number;
}

/** Respuesta de `GET /estudiantes/:id/practica-semanal` y del `PUT …/hoy`. */
export interface PracticaSemanalDto {
  estudiante: EstudianteResumenDto;
  /** Hoy, en hora de Bogotá (AAAA-MM-DD). */
  hoy: string;
  /** Lunes a domingo de esta semana. */
  dias: { fecha: string; practicado: boolean }[];
  practicadoHoy: boolean;
}

/** Una observación de `GET /estudiantes/:id/observaciones`. */
export interface ObservacionDto {
  id: string;
  estudianteId: string;
  autor: { id: string; displayName: string };
  texto: string;
  visibleAcudiente: boolean;
  fecha: string;
}

export interface PaginaObservacionesDto {
  items: ObservacionDto[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Una actividad de `GET /estudiantes/:id/actividades`: misma forma que las
 * pendientes del estudiante, con su retroalimentación.
 */
export type ActividadEstudianteDto = ActividadPendienteDto;
