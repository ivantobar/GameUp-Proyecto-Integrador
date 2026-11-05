import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PersonaDto } from '../../../estudiantes/presentation/dto/estudiante.dto.js';
import { LARGO_MAXIMO_OBSERVACION } from '../../domain/observacion.entity.js';

// ─── Entrada ────────────────────────────────────────────────────────────────

export class CrearObservacionDto {
  @ApiProperty({
    example: 'Hoy reconoció la vocal e sin ayuda.',
    maxLength: LARGO_MAXIMO_OBSERVACION,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(LARGO_MAXIMO_OBSERVACION)
  texto: string;

  @ApiPropertyOptional({
    example: true,
    default: false,
    description:
      'true: la ve el acudiente y recibe una notificación. Por defecto, solo la ve el equipo.',
  })
  @IsOptional()
  @IsBoolean()
  visibleAcudiente?: boolean;
}

/** Al menos uno de los dos campos. */
export class EditarObservacionDto {
  @ApiPropertyOptional({
    example: 'Hoy reconoció la vocal e y la a sin ayuda.',
    maxLength: LARGO_MAXIMO_OBSERVACION,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(LARGO_MAXIMO_OBSERVACION)
  texto?: string;

  @ApiPropertyOptional({
    example: true,
    description:
      'Al pasar a true, el acudiente recibe una notificación (solo la primera vez).',
  })
  @IsOptional()
  @IsBoolean()
  visibleAcudiente?: boolean;
}

// ─── Salida ─────────────────────────────────────────────────────────────────

export class ObservacionDto {
  @ApiProperty({ example: '7' }) id: string;
  @ApiProperty({ example: '10' }) estudianteId: string;
  @ApiProperty({ type: PersonaDto, description: 'Quien la escribió' })
  autor: PersonaDto;
  @ApiProperty({ example: 'Hoy reconoció la vocal e sin ayuda.' })
  texto: string;
  @ApiProperty({ example: true }) visibleAcudiente: boolean;
  @ApiProperty({ example: '2026-11-05T15:00:00.000Z' }) fecha: string;
}

export class PaginaObservacionesDto {
  @ApiProperty({ type: [ObservacionDto] }) items: ObservacionDto[];
  @ApiProperty({ example: 3 }) total: number;
  @ApiProperty({ example: 1 }) page: number;
  @ApiProperty({ example: 20 }) limit: number;
}
