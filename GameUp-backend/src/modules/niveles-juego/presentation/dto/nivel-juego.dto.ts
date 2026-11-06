import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, MaxLength, Min } from 'class-validator';
import {
  JUEGOS_CON_ESCALERA,
  NIVEL_JUEGO_MAXIMO,
  NIVEL_JUEGO_MINIMO,
  type JuegoConEscalera,
} from '../../../catalogo/domain/juegos/niveles-juego.js';
import { ActividadDto } from '../../../modulos/presentation/dto/modulo.dto.js';
import { LARGO_MAXIMO_MOTIVO } from '../../domain/nivel-juego.js';

// ─── Entrada ────────────────────────────────────────────────────────────────

export class AjustarNivelJuegoDto {
  @ApiProperty({
    example: 3,
    minimum: NIVEL_JUEGO_MINIMO,
    maximum: NIVEL_JUEGO_MAXIMO,
    description:
      'Nivel en el que seguirá (puede ser menor). Queda sin completar.',
  })
  @IsInt()
  @Min(NIVEL_JUEGO_MINIMO)
  @Max(NIVEL_JUEGO_MAXIMO)
  nivel: number;

  @ApiProperty({
    example: 'Ya domina las parejas de 3; sigue en 4',
    maxLength: LARGO_MAXIMO_MOTIVO,
    description: 'Obligatorio: queda en el historial',
  })
  @IsString()
  @MaxLength(LARGO_MAXIMO_MOTIVO)
  motivo: string;
}

// ─── Salida ─────────────────────────────────────────────────────────────────

export class NivelJuegoDto {
  @ApiProperty({ enum: JUEGOS_CON_ESCALERA, example: 'MEMORIA' })
  juego: JuegoConEscalera;
  @ApiProperty({ example: 'Memoria' }) nombre: string;
  @ApiProperty({ example: 2, minimum: 1, maximum: NIVEL_JUEGO_MAXIMO })
  nivelActual: number;
  @ApiProperty({ example: NIVEL_JUEGO_MAXIMO }) nivelMaximo: number;
  @ApiProperty({
    example: false,
    description: 'Aprobó el nivel 5: puede seguir jugando el 5',
  })
  completado: boolean;
  @ApiProperty({
    example: 1,
    description:
      'Intentos del nivel actual que esperan a la tallerista (no suben solos)',
  })
  pendientesValidacion: number;
  @ApiProperty({ example: '2026-11-06T15:00:00.000Z' }) actualizadoEn: string;
}

export class ActividadDelNivelDto {
  @ApiProperty({ type: NivelJuegoDto }) nivel: NivelJuegoDto;
  @ApiProperty({
    type: ActividadDto,
    description:
      'Actividad del nivel actual. Sus imágenes: GET /modulos/:moduloId/contenidos/urls',
  })
  actividad: ActividadDto;
}

/** Lo que pasó con el nivel al aprobar un intento de la escalera. */
export class SubidaNivelDto {
  @ApiProperty({ example: '41' }) intentoId: string;
  @ApiProperty({ enum: JUEGOS_CON_ESCALERA, example: 'MEMORIA' })
  juego: JuegoConEscalera;
  @ApiProperty({ example: 1 }) nivelAnterior: number;
  @ApiProperty({ example: 2 }) nivelNuevo: number;
  @ApiProperty({ example: false, description: 'true: aprobó el nivel 5' })
  completado: boolean;
}
