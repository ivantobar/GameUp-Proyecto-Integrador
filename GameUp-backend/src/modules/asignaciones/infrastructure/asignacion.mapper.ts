import { fechaSinHoraATexto } from '../../../common/fechas/fechas.js';
import { idATexto } from '../../../common/ids/ids.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import {
  inicialesDe,
  nombreCortoDe,
} from '../../estudiantes/domain/estudiante.entity.js';
import {
  nombreVisiblePersona,
  SELECCION_PERSONA,
} from '../../estudiantes/infrastructure/estudiante.mapper.js';
import type {
  ActividadDeAsignacion,
  DetalleAsignacion,
  ProgresoOficial,
} from '../application/avance-asignacion.service.js';
import {
  Asignacion,
  ESTADOS_ASIGNACION,
  type AvanceActividad,
  type EstadoAsignacion,
  type IntentoResumen,
} from '../domain/asignacion.entity.js';
import type {
  ProgresoOficialDto,
  ActividadEstudianteDto,
  AsignacionDetalleDto,
  AsignacionDto,
  AvanceActividadDto,
} from '../presentation/dto/asignacion.dto.js';

export const SELECCION_ASIGNACION = {
  id: true,
  fecha_asignacion: true,
  fecha_sugerida: true,
  estado: true,
  progreso: true,
  modulo: { select: { id: true, nombre: true } },
  usuario: { select: SELECCION_PERSONA },
  estudiante: { select: { usuario: { select: SELECCION_PERSONA } } },
} satisfies Prisma.asignacionSelect;

export type FilaAsignacion = Prisma.asignacionGetPayload<{
  select: typeof SELECCION_ASIGNACION;
}>;

export const SELECCION_INTENTO = {
  asignacion_id: true,
  actividad_id: true,
  numero_intento: true,
  fecha: true,
  validacion: { select: { resultado: true, retroalimentacion: true } },
} satisfies Prisma.intentoSelect;

export type FilaIntento = Prisma.intentoGetPayload<{
  select: typeof SELECCION_INTENTO;
}>;

/** «Martín C.» e iniciales, igual que en el listado de estudiantes. */
function resumenEstudiante(a: Asignacion) {
  return {
    id: idATexto(a.estudiante.id),
    displayName: nombreCortoDe(a.estudiante),
    initials: inicialesDe(a.estudiante),
  };
}

export const AsignacionMapper = {
  aEntidad(f: FilaAsignacion): Asignacion {
    // asignacion_estado_check lo garantiza.
    if (!(ESTADOS_ASIGNACION as readonly string[]).includes(f.estado)) {
      throw new Error('Estado de asignación desconocido');
    }
    return new Asignacion({
      id: f.id,
      modulo: f.modulo,
      estudiante: f.estudiante.usuario,
      asignadoPor: f.usuario,
      fechaAsignacion: f.fecha_asignacion,
      fechaSugerida: f.fecha_sugerida,
      estado: f.estado as EstadoAsignacion,
      progreso: f.progreso,
    });
  },

  aIntento(f: FilaIntento): IntentoResumen {
    const v = f.validacion;
    return {
      actividadId: f.actividad_id,
      numeroIntento: f.numero_intento,
      fecha: f.fecha,
      validacion: v
        ? {
            // validacion_resultado_check: APROBADO o RECHAZADO.
            resultado: v.resultado as 'APROBADO' | 'RECHAZADO',
            retroalimentacion: v.retroalimentacion,
          }
        : null,
    };
  },

  // ─── Entidad → DTO ────────────────────────────────────────────────────────

  aDto(a: Asignacion): AsignacionDto {
    return {
      id: idATexto(a.id),
      modulo: { id: idATexto(a.modulo.id), nombre: a.modulo.nombre },
      estudiante: resumenEstudiante(a),
      asignadoPor: {
        id: idATexto(a.asignadoPor.id),
        displayName: nombreVisiblePersona(a.asignadoPor),
      },
      fechaAsignacion: a.fechaAsignacion.toISOString(),
      fechaSugerida: a.fechaSugerida
        ? fechaSinHoraATexto(a.fechaSugerida)
        : null,
      estado: a.estado,
      progreso: a.progreso,
    };
  },

  aAvanceDto(v: AvanceActividad): AvanceActividadDto {
    return {
      actividadId: idATexto(v.actividad.id),
      titulo: v.actividad.titulo,
      tipoJuego: v.actividad.tipoJuego,
      orden: v.actividad.orden,
      vocal: v.vocal,
      estado: v.estado,
      intentos: v.intentos,
      esNueva: v.esNueva,
      retroalimentacion: v.retroalimentacion,
    };
  },

  aDetalleDto(d: DetalleAsignacion): AsignacionDetalleDto {
    return {
      ...AsignacionMapper.aDto(d.asignacion),
      actividades: d.actividades.map(AsignacionMapper.aAvanceDto),
      resumen: d.resumen,
    };
  },

  aProgresoDto(p: ProgresoOficial): ProgresoOficialDto {
    return {
      modulos: p.modulos.map(({ asignacion, resumen }) => ({
        asignacionId: idATexto(asignacion.id),
        modulo: {
          id: idATexto(asignacion.modulo.id),
          nombre: asignacion.modulo.nombre,
        },
        estado: asignacion.estado,
        progreso: asignacion.progreso,
        validadas: resumen.aprobadas,
        total: resumen.total,
        pendientesValidacion: resumen.pendientesValidacion,
      })),
      pendientesValidacion: p.pendientesValidacion,
    };
  },

  /** También sirve para las pendientes del estudiante (misma forma). */
  aActividadDto(p: ActividadDeAsignacion): ActividadEstudianteDto {
    return {
      asignacionId: idATexto(p.asignacion.id),
      modulo: {
        id: idATexto(p.asignacion.modulo.id),
        nombre: p.asignacion.modulo.nombre,
      },
      fechaSugerida: p.asignacion.fechaSugerida
        ? fechaSinHoraATexto(p.asignacion.fechaSugerida)
        : null,
      ...AsignacionMapper.aAvanceDto(p.avance),
    };
  },
} as const;
