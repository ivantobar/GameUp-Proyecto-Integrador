import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsObject, IsOptional, Max, Min } from 'class-validator';
import { IsIdNumerico } from '../../../../common/ids/ids.js';
import {
  CODIGOS_JUEGO,
  type CodigoJuego,
} from '../../../catalogo/domain/juegos/estrategia-juego.js';
import { VOCALES } from '../../../catalogo/domain/juegos/estrategias.js';
import {
  ESTADOS_GRABACION,
  type EstadoGrabacion,
} from '../../domain/intento.entity.js';

// ─── Entrada ────────────────────────────────────────────────────────────────

export class RegistrarIntentoDto {
  @ApiProperty({ example: '8' })
  @IsIdNumerico()
  actividadId: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: { firstTryCorrect: 3, total: 5 },
    description:
      'EMPAREJAR, CLASIFICAR, SECUENCIAR, BUSCA_LA_BOCA: { firstTryCorrect, total }. ' +
      'MEMORIA: { pairs, mismatches }. total/pairs deben coincidir con la actividad.',
  })
  @IsObject()
  resultado: Record<string, unknown>;
}

/** Campos de texto del multipart de Habla conmigo (el audio va en `audio`). */
export class RegistrarIntentoVozDto {
  @ApiProperty({ example: '8' })
  @IsIdNumerico()
  actividadId: string;

  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(120)
  duracionSeg?: number;
}

// ─── Salida ─────────────────────────────────────────────────────────────────

export class ValidacionIntentoDto {
  @ApiProperty({ enum: ['APROBADO', 'RECHAZADO'], example: 'RECHAZADO' })
  resultado: 'APROBADO' | 'RECHAZADO';
  @ApiProperty({ example: 'Abre más la boca', nullable: true, type: String })
  retroalimentacion: string | null;
  @ApiProperty({ example: '2026-11-05T16:00:00.000Z' }) fecha: string;
}

export class IntentoDto {
  @ApiProperty({ example: '40' }) id: string;
  @ApiProperty({
    example: '12',
    nullable: true,
    type: String,
    description: 'null en los intentos de la escalera de niveles',
  })
  asignacionId: string | null;
  @ApiProperty({ example: '8' }) actividadId: string;
  @ApiProperty({ enum: CODIGOS_JUEGO, example: 'HABLA_CONMIGO' })
  tipoJuego: CodigoJuego;
  @ApiProperty({
    example: null,
    nullable: true,
    type: Number,
    description:
      'Nivel (1-5) si es de la escalera de niveles; null si es de un módulo',
  })
  nivelJuego: number | null;
  @ApiProperty({ example: 2, description: 'Lo pone la base' })
  numeroIntento: number;
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: { estadoGrabacion: 'ADJUNTA' },
  })
  resultado: Record<string, unknown>;
  @ApiProperty({
    example: 2,
    description: 'Estrellas de práctica (0-3). No son una nota.',
  })
  estrellas: number;
  @ApiProperty({ example: '2026-11-05T15:00:00.000Z' }) fecha: string;
  @ApiProperty({
    enum: ['PENDIENTE_VALIDACION', 'APROBADO', 'RECHAZADO'],
    example: 'PENDIENTE_VALIDACION',
  })
  estado: 'PENDIENTE_VALIDACION' | 'APROBADO' | 'RECHAZADO';
  @ApiProperty({ type: ValidacionIntentoDto, nullable: true })
  validacion: ValidacionIntentoDto | null;
  @ApiProperty({
    example: true,
    description: 'Hay audio guardado (aún no borrado)',
  })
  tieneAudio: boolean;
}

export class IntentoVozDto extends IntentoDto {
  @ApiProperty({
    enum: ESTADOS_GRABACION,
    example: 'ADJUNTA',
    description:
      'ADJUNTA: audio guardado · NO_ENVIADA · SIN_CONSENTIMIENTO y NO_VERIFICABLE: el audio se descartó · NO_GUARDADA: falló Storage',
  })
  estadoGrabacion: EstadoGrabacion;
  @ApiProperty({ example: true }) grabacionGuardada: boolean;
  @ApiProperty({
    example: 2,
    description: 'Estrellas de la vocal después de este intento',
  })
  estrellasPractica: number;
}

export class PracticaVocalDto {
  @ApiProperty({ enum: VOCALES, example: 'a' }) vocal: string;
  @ApiProperty({ example: 2, minimum: 0, maximum: 3 }) estrellas: number;
}

export class PuntoRetornoDto {
  @ApiProperty({
    nullable: true,
    type: Object,
    example: { tipoJuego: 'HABLA_CONMIGO', vocal: 'e' },
    description: '«Sigue donde ibas», o null si aún no practicó',
  })
  puntoRetorno: { tipoJuego: 'HABLA_CONMIGO'; vocal: string } | null;
}
