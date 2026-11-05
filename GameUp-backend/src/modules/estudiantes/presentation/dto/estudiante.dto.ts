import { ApiProperty } from '@nestjs/swagger';
import {
  ESTADOS_ESTUDIANTE,
  type EstadoEstudiante,
} from '../../../usuarios/domain/usuario.entity.js';

export class NivelDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'BAJO' })
  nombre: string;
}

export class PersonaDto {
  @ApiProperty({ example: '12' })
  id: string;

  @ApiProperty({ example: 'Ana Gómez' })
  displayName: string;
}

/** Estudiante en listados (StudentSummary en la app). */
export class EstudianteResumenDto {
  @ApiProperty({ example: '31' })
  id: string;

  @ApiProperty({
    example: 'Martín C.',
    description: 'Nombre y la inicial del apellido',
  })
  displayName: string;

  @ApiProperty({ example: 'MC', description: 'Dos letras para el círculo' })
  initials: string;

  @ApiProperty({ type: NivelDto })
  nivel: NivelDto;

  @ApiProperty({ enum: ESTADOS_ESTUDIANTE, example: 'ACTIVO' })
  estado: EstadoEstudiante;
}

/** Ficha del estudiante (directora, tallerista a cargo, acudiente). */
export class EstudianteDetalleDto extends EstudianteResumenDto {
  @ApiProperty({ example: 'Martín José' })
  nombres: string;

  @ApiProperty({ example: 'Cruz Pérez' })
  apellidos: string;

  @ApiProperty({ example: '2026-02-03', format: 'date' })
  fechaIngreso: string;

  @ApiProperty({ example: 'osito', nullable: true, type: String })
  personajeAvatar: string | null;

  @ApiProperty({
    example: true,
    description: 'Si la cuenta puede iniciar sesión',
  })
  cuentaActiva: boolean;
}

/** Lo que ve el propio estudiante (StudentProfile en la app). */
export class EstudiantePropioDto {
  @ApiProperty({ example: '31' })
  id: string;

  @ApiProperty({
    example: 'Martín',
    description: 'Primer nombre: así lo saluda la app',
  })
  displayName: string;

  @ApiProperty({ example: 'osito', nullable: true, type: String })
  personajeAvatar: string | null;

  @ApiProperty({ type: NivelDto })
  nivel: NivelDto;
}

export class PaginaEstudiantesDto {
  @ApiProperty({ type: [EstudianteResumenDto] })
  items: EstudianteResumenDto[];

  @ApiProperty({ example: 8 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}

export class CambioNivelDto {
  @ApiProperty({ example: '5' })
  id: string;

  @ApiProperty({ type: NivelDto })
  nivel: NivelDto;

  @ApiProperty({ example: 'Avanza en vocales', nullable: true, type: String })
  motivo: string | null;

  @ApiProperty({ example: '2026-11-05T15:00:00.000Z' })
  fecha: string;

  @ApiProperty({
    type: PersonaDto,
    description: 'Directora que hizo el cambio',
  })
  asignadoPor: PersonaDto;
}

export class PaginaCambiosNivelDto {
  @ApiProperty({ type: [CambioNivelDto] })
  items: CambioNivelDto[];

  @ApiProperty({ example: 2 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}

export class TalleristaAsignadaDto {
  @ApiProperty({ example: '12' })
  talleristaId: string;

  @ApiProperty({ example: 'Ana Gómez' })
  displayName: string;

  @ApiProperty({ example: '2026-11-05', format: 'date' })
  fechaInicio: string;

  @ApiProperty({
    example: true,
    description: 'false: ya no está a cargo (historial)',
  })
  activo: boolean;
}

export class VinculoAcudienteDto {
  @ApiProperty({ example: '20' })
  acudienteId: string;

  @ApiProperty({ example: 'Laura Cruz' })
  displayName: string;

  @ApiProperty({ example: 'Madre' })
  parentesco: string;

  @ApiProperty({ example: true })
  esPrincipal: boolean;
}
