import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional, Matches } from 'class-validator';
import { IsIdNumerico } from '../../../../common/ids/ids.js';
import { PaginacionQueryDto } from '../../../../common/paginacion/paginacion.js';
import {
  CODIGOS_JUEGO,
  type CodigoJuego,
} from '../../../catalogo/domain/juegos/estrategia-juego.js';
import {
  NivelDto,
  PersonaDto,
} from '../../../estudiantes/presentation/dto/estudiante.dto.js';
import {
  ESTADOS_ACTIVIDAD,
  ESTADOS_ASIGNACION,
  type EstadoActividad,
  type EstadoAsignacion,
} from '../../domain/asignacion.entity.js';

// ─── Entrada ────────────────────────────────────────────────────────────────

export class CrearAsignacionDto {
  @ApiProperty({ example: '3' })
  @IsIdNumerico()
  moduloId: string;

  @ApiProperty({ example: '31' })
  @IsIdNumerico()
  estudianteId: string;

  @ApiPropertyOptional({
    example: '2026-11-20',
    format: 'date',
    description:
      'Fecha sugerida para terminarlo (no antes de hoy, hora de Bogotá)',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fechaSugerida debe tener el formato AAAA-MM-DD',
  })
  @IsISO8601(
    { strict: true },
    { message: 'fechaSugerida no es una fecha válida' },
  )
  fechaSugerida?: string;
}

/** GET /asignaciones?estudianteId&moduloId&estado&page&limit */
export class ListarAsignacionesQueryDto extends PaginacionQueryDto {
  @ApiPropertyOptional({ example: '31' })
  @IsOptional()
  @IsIdNumerico()
  estudianteId?: string;

  @ApiPropertyOptional({ example: '3' })
  @IsOptional()
  @IsIdNumerico()
  moduloId?: string;

  @ApiPropertyOptional({ enum: ESTADOS_ASIGNACION, example: 'EN_CURSO' })
  @IsOptional()
  @IsIn(ESTADOS_ASIGNACION)
  estado?: EstadoAsignacion;
}

// ─── Salida ─────────────────────────────────────────────────────────────────

export class EstudianteAsignadoDto {
  @ApiProperty({ example: '31' }) id: string;
  @ApiProperty({ example: 'Martín C.' }) displayName: string;
  @ApiProperty({ example: 'MC' }) initials: string;
}

export class AsignacionDto {
  @ApiProperty({ example: '12' }) id: string;
  @ApiProperty({ type: NivelDto, description: 'Módulo { id, nombre }' })
  modulo: NivelDto;
  @ApiProperty({ type: EstudianteAsignadoDto })
  estudiante: EstudianteAsignadoDto;
  @ApiProperty({ type: PersonaDto }) asignadoPor: PersonaDto;
  @ApiProperty({ example: '2026-11-05T15:00:00.000Z' }) fechaAsignacion: string;
  @ApiProperty({
    example: '2026-11-20',
    nullable: true,
    type: String,
    format: 'date',
  })
  fechaSugerida: string | null;
  @ApiProperty({ enum: ESTADOS_ASIGNACION, example: 'EN_CURSO' })
  estado: EstadoAsignacion;
  @ApiProperty({
    example: 50,
    description:
      'Progreso oficial 0-100: solo actividades activas con validación APROBADO',
  })
  progreso: number;
}

export class PaginaAsignacionesDto {
  @ApiProperty({ type: [AsignacionDto] }) items: AsignacionDto[];
  @ApiProperty({ example: 3 }) total: number;
  @ApiProperty({ example: 1 }) page: number;
  @ApiProperty({ example: 20 }) limit: number;
}

export class AvanceActividadDto {
  @ApiProperty({ example: '8' }) actividadId: string;
  @ApiProperty({ example: 'Di la a' }) titulo: string;
  @ApiProperty({ enum: CODIGOS_JUEGO, example: 'HABLA_CONMIGO' })
  tipoJuego: CodigoJuego;
  @ApiProperty({ example: 0 }) orden: number;
  @ApiProperty({
    example: 'a',
    nullable: true,
    type: String,
    description: 'Solo Habla conmigo',
  })
  vocal: string | null;
  @ApiProperty({ enum: ESTADOS_ACTIVIDAD, example: 'PENDIENTE_VALIDACION' })
  estado: EstadoActividad;
  @ApiProperty({ example: 2 }) intentos: number;
  @ApiProperty({ example: false, description: 'Aún no tiene intentos' })
  esNueva: boolean;
  @ApiProperty({
    example: 'Abre más la boca en la a',
    nullable: true,
    type: String,
    description:
      'RECHAZADA: la del último intento. APROBADA: la del intento aprobado, si la tallerista dejó una. Si no, null.',
  })
  retroalimentacion: string | null;
}

export class ResumenAvanceDto {
  @ApiProperty({ example: 4, description: 'Actividades activas del módulo' })
  total: number;
  @ApiProperty({ example: 2 }) aprobadas: number;
  @ApiProperty({
    example: 1,
    description: 'Esperan validación; no suman al progreso',
  })
  pendientesValidacion: number;
}

export class AsignacionDetalleDto extends AsignacionDto {
  @ApiProperty({ type: [AvanceActividadDto] })
  actividades: AvanceActividadDto[];
  @ApiProperty({ type: ResumenAvanceDto }) resumen: ResumenAvanceDto;
}

/** Una actividad de un módulo asignado, con su estado y retroalimentación. */
export class ActividadEstudianteDto extends AvanceActividadDto {
  @ApiProperty({ example: '12' }) asignacionId: string;
  @ApiProperty({ type: NivelDto, description: 'Módulo { id, nombre }' })
  modulo: NivelDto;
  @ApiProperty({
    example: '2026-11-20',
    nullable: true,
    type: String,
    format: 'date',
  })
  fechaSugerida: string | null;
}

/** Lo que el estudiante tiene por hacer (Assignment en la app). */
export class ActividadPendienteDto extends ActividadEstudianteDto {}

/** Avance de un módulo asignado (ModuleProgress en la app). */
export class ProgresoModuloDto {
  @ApiProperty({ example: '12' }) asignacionId: string;
  @ApiProperty({ type: NivelDto, description: 'Módulo { id, nombre }' })
  modulo: NivelDto;
  @ApiProperty({ enum: ESTADOS_ASIGNACION, example: 'EN_CURSO' })
  estado: EstadoAsignacion;
  @ApiProperty({
    example: 50,
    description: 'Progreso oficial 0-100 (lo calcula la base)',
  })
  progreso: number;
  @ApiProperty({
    example: 2,
    description: 'Actividades activas con un intento APROBADO',
  })
  validadas: number;
  @ApiProperty({ example: 4, description: 'Actividades activas del módulo' })
  total: number;
  @ApiProperty({
    example: 1,
    description: 'Actividades cuyo último intento espera validación; no suman',
  })
  pendientesValidacion: number;
}

/** Progreso oficial (OfficialProgress en la app): solo lo validado. */
export class ProgresoOficialDto {
  @ApiProperty({ type: [ProgresoModuloDto] }) modulos: ProgresoModuloDto[];
  @ApiProperty({
    example: 1,
    description:
      'Actividades que esperan validación, sumando todos los módulos',
  })
  pendientesValidacion: number;
}
