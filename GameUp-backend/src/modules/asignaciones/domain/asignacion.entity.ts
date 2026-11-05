import type { Configuracion } from '../../catalogo/domain/juegos/estrategia-juego.js';
import type { CodigoJuego } from '../../catalogo/domain/juegos/estrategia-juego.js';
import type { PersonaResumen } from '../../estudiantes/domain/estudiante.entity.js';

export const ESTADOS_ASIGNACION = [
  'ASIGNADO',
  'EN_CURSO',
  'COMPLETADO',
] as const;
export type EstadoAsignacion = (typeof ESTADOS_ASIGNACION)[number];

export interface PropiedadesAsignacion {
  id: bigint;
  modulo: { id: bigint; nombre: string };
  estudiante: PersonaResumen;
  asignadoPor: PersonaResumen;
  fechaAsignacion: Date;
  fechaSugerida: Date | null;
  /** Lo mantiene la base: ASIGNADO → EN_CURSO (primer intento) → COMPLETADO (todo aprobado). */
  estado: EstadoAsignacion;
  /** 0-100, calculado por la base: actividades activas con validación APROBADO. */
  progreso: number;
}

/** Un módulo asignado a un estudiante. */
export class Asignacion {
  readonly id: bigint;
  readonly modulo: { id: bigint; nombre: string };
  readonly estudiante: PersonaResumen;
  readonly asignadoPor: PersonaResumen;
  readonly fechaAsignacion: Date;
  readonly fechaSugerida: Date | null;
  readonly estado: EstadoAsignacion;
  readonly progreso: number;

  constructor(p: PropiedadesAsignacion) {
    this.id = p.id;
    this.modulo = p.modulo;
    this.estudiante = p.estudiante;
    this.asignadoPor = p.asignadoPor;
    this.fechaAsignacion = p.fechaAsignacion;
    this.fechaSugerida = p.fechaSugerida;
    this.estado = p.estado;
    this.progreso = p.progreso;
  }

  /** En una asignación completada ya no se registran intentos (lo exige la base). */
  estaCompletada(): boolean {
    return this.estado === 'COMPLETADO';
  }
}

/** Un intento ya hecho, con su validación si la hay. */
export interface IntentoResumen {
  actividadId: bigint;
  numeroIntento: number;
  fecha: Date;
  validacion: {
    resultado: 'APROBADO' | 'RECHAZADO';
    retroalimentacion: string | null;
  } | null;
}

/**
 * Estado de una actividad dentro de una asignación (para la app):
 *  - SIN_INTENTOS: aún no la hace.
 *  - PENDIENTE_VALIDACION: el último intento espera a la tallerista.
 *  - RECHAZADA: la tallerista pidió practicar más (último intento).
 *  - APROBADA: algún intento fue aprobado (cuenta para el progreso).
 */
export const ESTADOS_ACTIVIDAD = [
  'SIN_INTENTOS',
  'PENDIENTE_VALIDACION',
  'RECHAZADA',
  'APROBADA',
] as const;
export type EstadoActividad = (typeof ESTADOS_ACTIVIDAD)[number];

export interface ActividadAsignada {
  id: bigint;
  titulo: string;
  tipoJuego: CodigoJuego;
  configuracion: Configuracion;
  orden: number;
}

export interface AvanceActividad {
  actividad: ActividadAsignada;
  estado: EstadoActividad;
  intentos: number;
  /** Sin intentos todavía: la app la marca como nueva. */
  esNueva: boolean;
  /** Retroalimentación del último intento rechazado (si el último fue rechazado). */
  retroalimentacion: string | null;
  /** Vocal de Habla conmigo (configuracion.vocal), o null. */
  vocal: string | null;
}

/** Misma regla que el progreso de la base: basta un intento aprobado. */
export function avanceDe(
  actividad: ActividadAsignada,
  intentos: readonly IntentoResumen[],
): AvanceActividad {
  const propios = intentos
    .filter((i) => i.actividadId === actividad.id)
    .sort((a, b) => a.numeroIntento - b.numeroIntento);
  const ultimo = propios.at(-1);
  let estado: EstadoActividad;
  if (propios.some((i) => i.validacion?.resultado === 'APROBADO'))
    estado = 'APROBADA';
  else if (!ultimo) estado = 'SIN_INTENTOS';
  else if (!ultimo.validacion) estado = 'PENDIENTE_VALIDACION';
  else estado = 'RECHAZADA';

  const vocal = actividad.configuracion['vocal'];
  return {
    actividad,
    estado,
    intentos: propios.length,
    esNueva: propios.length === 0,
    retroalimentacion:
      estado === 'RECHAZADA'
        ? (ultimo?.validacion?.retroalimentacion ?? null)
        : null,
    vocal:
      actividad.tipoJuego === 'HABLA_CONMIGO' && typeof vocal === 'string'
        ? vocal
        : null,
  };
}

/** Lo que el estudiante tiene por hacer: sin intentos o rechazada (volver a intentar). */
export function estaPorHacer(avance: AvanceActividad): boolean {
  return avance.estado === 'SIN_INTENTOS' || avance.estado === 'RECHAZADA';
}
