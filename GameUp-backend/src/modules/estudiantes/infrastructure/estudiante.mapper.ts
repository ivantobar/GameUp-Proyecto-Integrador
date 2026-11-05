import { fechaSinHoraATexto } from '../../../common/fechas/fechas.js';
import { idATexto } from '../../../common/ids/ids.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import {
  ESTADOS_ESTUDIANTE,
  type EstadoEstudiante,
} from '../../usuarios/domain/usuario.entity.js';
import {
  Estudiante,
  type CambioNivel,
  type PersonaResumen,
  type TalleristaAsignada,
  type VinculoAcudiente,
} from '../domain/estudiante.entity.js';
import type {
  CambioNivelDto,
  EstudianteDetalleDto,
  EstudiantePropioDto,
  EstudianteResumenDto,
  PersonaDto,
  TalleristaAsignadaDto,
  VinculoAcudienteDto,
} from '../presentation/dto/estudiante.dto.js';

export const SELECCION_PERSONA = {
  id: true,
  nombres: true,
  apellidos: true,
} satisfies Prisma.usuarioSelect;

export const SELECCION_ESTUDIANTE = {
  usuario_id: true,
  estado: true,
  fecha_ingreso: true,
  personaje_avatar: true,
  id_estudiante_externo: true,
  nivel: { select: { id: true, nombre: true } },
  usuario: { select: { nombres: true, apellidos: true, activo: true } },
} satisfies Prisma.estudianteSelect;

export type FilaEstudiante = Prisma.estudianteGetPayload<{
  select: typeof SELECCION_ESTUDIANTE;
}>;

function estado(valor: string): EstadoEstudiante {
  // La base lo garantiza con estudiante_estado_check.
  if (!(ESTADOS_ESTUDIANTE as readonly string[]).includes(valor)) {
    throw new Error('Estado de estudiante desconocido');
  }
  return valor as EstadoEstudiante;
}

/** «Ana Gómez»: primer nombre y primer apellido de un adulto. */
export function nombreVisiblePersona(p: PersonaResumen): string {
  const [nombre = ''] = p.nombres.trim().split(/\s+/);
  const [apellido] = p.apellidos.trim().split(/\s+/);
  return apellido ? `${nombre} ${apellido}` : nombre;
}

function personaADto(p: PersonaResumen): PersonaDto {
  return { id: idATexto(p.id), displayName: nombreVisiblePersona(p) };
}

export const EstudianteMapper = {
  aEntidad(fila: FilaEstudiante): Estudiante {
    return new Estudiante({
      id: fila.usuario_id,
      nombres: fila.usuario.nombres,
      apellidos: fila.usuario.apellidos,
      cuentaActiva: fila.usuario.activo,
      estado: estado(fila.estado),
      nivel: fila.nivel,
      fechaIngreso: fila.fecha_ingreso,
      personajeAvatar: fila.personaje_avatar,
      idEstudianteExterno: fila.id_estudiante_externo,
    });
  },

  aTalleristaAsignada(fila: {
    fecha_inicio: Date;
    activo: boolean;
    usuario: PersonaResumen;
  }): TalleristaAsignada {
    return {
      tallerista: fila.usuario,
      fechaInicio: fila.fecha_inicio,
      activo: fila.activo,
    };
  },

  aVinculoAcudiente(fila: {
    parentesco: string;
    es_principal: boolean;
    usuario: PersonaResumen;
  }): VinculoAcudiente {
    return {
      acudiente: fila.usuario,
      parentesco: fila.parentesco,
      esPrincipal: fila.es_principal,
    };
  },

  // ─── Entidad → DTO ────────────────────────────────────────────────────────

  aResumenDto(e: Estudiante): EstudianteResumenDto {
    return {
      id: idATexto(e.id),
      displayName: e.nombreCorto(),
      initials: e.iniciales(),
      nivel: { id: idATexto(e.nivel.id), nombre: e.nivel.nombre },
      estado: e.estado,
    };
  },

  aDetalleDto(e: Estudiante): EstudianteDetalleDto {
    return {
      ...EstudianteMapper.aResumenDto(e),
      nombres: e.nombres,
      apellidos: e.apellidos,
      fechaIngreso: fechaSinHoraATexto(e.fechaIngreso),
      personajeAvatar: e.personajeAvatar,
      cuentaActiva: e.cuentaActiva,
    };
  },

  aPropioDto(e: Estudiante): EstudiantePropioDto {
    return {
      id: idATexto(e.id),
      displayName: e.primerNombre(),
      personajeAvatar: e.personajeAvatar,
      nivel: { id: idATexto(e.nivel.id), nombre: e.nivel.nombre },
    };
  },

  cambioNivelADto(c: CambioNivel): CambioNivelDto {
    return {
      id: idATexto(c.id),
      nivel: { id: idATexto(c.nivel.id), nombre: c.nivel.nombre },
      motivo: c.motivo,
      fecha: c.fecha.toISOString(),
      asignadoPor: personaADto(c.asignadoPor),
    };
  },

  talleristaADto(t: TalleristaAsignada): TalleristaAsignadaDto {
    return {
      talleristaId: idATexto(t.tallerista.id),
      displayName: nombreVisiblePersona(t.tallerista),
      fechaInicio: fechaSinHoraATexto(t.fechaInicio),
      activo: t.activo,
    };
  },

  acudienteADto(v: VinculoAcudiente): VinculoAcudienteDto {
    return {
      acudienteId: idATexto(v.acudiente.id),
      displayName: nombreVisiblePersona(v.acudiente),
      parentesco: v.parentesco,
      esPrincipal: v.esPrincipal,
    };
  },
} as const;
