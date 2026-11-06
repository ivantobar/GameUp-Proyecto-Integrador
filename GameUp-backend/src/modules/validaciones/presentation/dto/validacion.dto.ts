import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { IsIdNumerico } from '../../../../common/ids/ids.js';
import { PaginacionQueryDto } from '../../../../common/paginacion/paginacion.js';
import {
  CODIGOS_JUEGO,
  type CodigoJuego,
} from '../../../catalogo/domain/juegos/estrategia-juego.js';
import { NivelDto } from '../../../estudiantes/presentation/dto/estudiante.dto.js';
import { IntentoDto } from '../../../intentos/presentation/dto/intento.dto.js';
import { SubidaNivelDto } from '../../../niveles-juego/presentation/dto/nivel-juego.dto.js';
import {
  LARGO_MAXIMO_RETROALIMENTACION,
  MAXIMO_LOTE,
  RESULTADOS_VALIDACION,
  type ResultadoValidacion,
} from '../../domain/validacion.js';

// ─── Entrada ────────────────────────────────────────────────────────────────

export class PendientesQueryDto extends PaginacionQueryDto {
  @ApiPropertyOptional({
    example: '10',
    description: 'Solo los de este estudiante',
  })
  @IsOptional()
  @IsIdNumerico()
  estudianteId?: string;
}

export class ValidarIntentoDto {
  @ApiProperty({
    enum: RESULTADOS_VALIDACION,
    example: 'RECHAZADO',
    description: 'APROBADO («Lo logró») o RECHAZADO («Practicar más»)',
  })
  @IsIn(RESULTADOS_VALIDACION)
  resultado: ResultadoValidacion;

  @ApiPropertyOptional({
    example: 'Abre más la boca en la a',
    maxLength: LARGO_MAXIMO_RETROALIMENTACION,
    description: 'Obligatoria si el resultado es RECHAZADO',
  })
  @IsOptional()
  @IsString()
  @MaxLength(LARGO_MAXIMO_RETROALIMENTACION)
  retroalimentacion?: string;
}

export class AprobarLoteDto {
  @ApiProperty({
    type: [String],
    example: ['41', '42', '43'],
    description: `Intentos de juegos sin voz (1 a ${MAXIMO_LOTE}). Los de Habla conmigo se validan uno por uno.`,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAXIMO_LOTE)
  @ArrayUnique()
  @IsIdNumerico({ each: true })
  intentoIds: string[];
}

// ─── Salida ─────────────────────────────────────────────────────────────────

export class EstudianteRevisionDto {
  @ApiProperty({ example: '10' }) id: string;
  @ApiProperty({ example: 'Martín C.' }) displayName: string;
  @ApiProperty({ example: 'MC' }) initials: string;
}

export class ActividadRevisionDto {
  @ApiProperty({ example: '8' }) id: string;
  @ApiProperty({ example: 'Di la a' }) titulo: string;
  @ApiProperty({
    example: null,
    nullable: true,
    type: Number,
    description: 'Nivel (1-5) si es de la escalera de niveles',
  })
  nivelJuego: number | null;
  @ApiProperty({ example: 'a', nullable: true, type: String }) vocal:
    string | null;
}

export class GrabacionRevisionDto {
  @ApiProperty({
    example: true,
    description: 'Se puede escuchar: pide la URL firmada',
  })
  disponible: boolean;
  @ApiProperty({
    example: false,
    description: 'Se borró al cumplir 30 días sin validar',
  })
  vencido: boolean;
}

/** Un intento por revisar (ReviewItem en la app). */
export class ItemRevisionDto {
  @ApiProperty({ example: '41' }) intentoId: string;
  @ApiProperty({ enum: ['VOZ', 'JUEGO'], example: 'VOZ' }) tipo:
    'VOZ' | 'JUEGO';
  @ApiProperty({ enum: CODIGOS_JUEGO, example: 'HABLA_CONMIGO' })
  tipoJuego: CodigoJuego;
  @ApiProperty({ type: EstudianteRevisionDto })
  estudiante: EstudianteRevisionDto;
  @ApiProperty({ type: ActividadRevisionDto }) actividad: ActividadRevisionDto;
  @ApiProperty({ type: NivelDto, description: 'Módulo { id, nombre }' })
  modulo: NivelDto;
  @ApiProperty({ example: '2026-11-05T15:00:00.000Z' }) fecha: string;
  @ApiProperty({ example: 2 }) numeroIntento: number;
  @ApiProperty({
    example: 2,
    description: 'Pendientes de la misma actividad («intento n de n»)',
  })
  pendientesMismaActividad: number;
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: { estadoGrabacion: 'ADJUNTA' },
  })
  resultado: Record<string, unknown>;
  @ApiProperty({
    example: true,
    nullable: true,
    type: Boolean,
    description:
      'Solo voz: ¿el acudiente autorizó grabar? Explica por qué no hay audio.',
  })
  consentimientoVoz: boolean | null;
  @ApiProperty({ type: GrabacionRevisionDto, nullable: true })
  grabacion: GrabacionRevisionDto | null;
}

export class PaginaRevisionDto {
  @ApiProperty({ type: [ItemRevisionDto] }) items: ItemRevisionDto[];
  @ApiProperty({ example: 4 }) total: number;
  @ApiProperty({ example: 1 }) page: number;
  @ApiProperty({ example: 20 }) limit: number;
}

export class IntentoValidadoDto extends IntentoDto {
  @ApiProperty({
    type: SubidaNivelDto,
    nullable: true,
    description: 'Si aprobar subió de nivel en la escalera (o completó el juego)',
  })
  subidaNivel: SubidaNivelDto | null;
}

export class LoteAprobadoDto {
  @ApiProperty({ example: 3 }) aprobados: number;
  @ApiProperty({
    type: [SubidaNivelDto],
    description: 'Subidas de nivel de la escalera que causó el lote',
  })
  subidas: SubidaNivelDto[];
}
