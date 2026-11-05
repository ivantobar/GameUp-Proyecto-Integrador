import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { IsIdNumerico } from '../../../../common/ids/ids.js';
import { PaginacionQueryDto } from '../../../../common/paginacion/paginacion.js';
import { CODIGOS_JUEGO } from '../../../catalogo/domain/juegos/estrategia-juego.js';
import {
  MAXIMO_ELEMENTOS,
  TIPOS_CONTENIDO,
  type TipoContenido,
} from '../../domain/modulo.entity.js';

const ORDEN_MAXIMO = 10000;

const aBooleano = ({ value }: { value: unknown }): unknown =>
  value === 'true' ? true : value === 'false' ? false : value;

// ─── Módulos ────────────────────────────────────────────────────────────────

export class ListarModulosQueryDto extends PaginacionQueryDto {
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsIdNumerico()
  categoriaId?: string;
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsIdNumerico()
  nivelId?: string;
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(aBooleano)
  @IsBoolean()
  publicado?: boolean;
}

export class CrearModuloDto {
  @ApiProperty({ example: '1' }) @IsIdNumerico() categoriaId: string;
  @ApiProperty({ example: '1' }) @IsIdNumerico() nivelId: string;

  @ApiProperty({ example: 'Vocal A', maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nombre: string;

  @ApiPropertyOptional({ example: 'Reconocer y decir la a', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsIdNumerico()
  musicaId?: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(ORDEN_MAXIMO)
  orden?: number;
}

/** Los campos que se envían con null se vacían (música, descripción, portada). */
export class ActualizarModuloDto {
  @ApiPropertyOptional({ example: '2' })
  @IsOptional()
  @IsIdNumerico()
  categoriaId?: string;
  @ApiPropertyOptional({ example: '2' })
  @IsOptional()
  @IsIdNumerico()
  nivelId?: string;

  @ApiPropertyOptional({ example: 'Vocal A (repaso)', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nombre?: string;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    type: String,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string | null;

  @ApiPropertyOptional({ example: null, nullable: true, type: String })
  @IsOptional()
  @IsIdNumerico()
  musicaId?: string | null;

  @ApiPropertyOptional({
    example: '14',
    nullable: true,
    type: String,
    description: 'Contenido IMAGEN de este módulo; null quita la portada',
  })
  @IsOptional()
  @IsIdNumerico()
  portadaContenidoId?: string | null;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(ORDEN_MAXIMO)
  orden?: number;
}

// ─── Contenidos ─────────────────────────────────────────────────────────────

/** Campos de texto del multipart (el archivo va en el campo `archivo`). */
export class SubirContenidoDto {
  @ApiProperty({ enum: TIPOS_CONTENIDO, example: 'VIDEO' })
  @IsIn(TIPOS_CONTENIDO)
  tipo: TipoContenido;

  @ApiProperty({ example: 'Mira cómo se dice la a', maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  titulo: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(ORDEN_MAXIMO)
  orden?: number;
}

export class ActualizarContenidoDto {
  @ApiPropertyOptional({ example: 'Video de la a', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  titulo?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(ORDEN_MAXIMO)
  orden?: number;
}

// ─── Actividades ────────────────────────────────────────────────────────────

export class CrearActividadDto {
  @ApiProperty({ enum: CODIGOS_JUEGO, example: 'HABLA_CONMIGO' })
  @IsIn(CODIGOS_JUEGO)
  tipoJuego: string;

  @ApiProperty({ example: 'Di la a', maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  titulo: string;

  @ApiPropertyOptional({ example: 'Mira el video y repite', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  instruccionTexto?: string;

  @ApiPropertyOptional({
    example: { vocal: 'a' },
    type: 'object',
    additionalProperties: true,
    description:
      'HABLA_CONMIGO: { "vocal": "a" }. Los demás juegos: {} (por ahora).',
  })
  @IsOptional()
  @IsObject()
  configuracion?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(ORDEN_MAXIMO)
  orden?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}

/** El tipo de juego no cambia. instruccionTexto: null la borra. */
export class ActualizarActividadDto {
  @ApiPropertyOptional({ example: 'Di la a otra vez', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  titulo?: string;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    type: String,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  instruccionTexto?: string | null;

  @ApiPropertyOptional({
    example: { vocal: 'e' },
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  configuracion?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(ORDEN_MAXIMO)
  orden?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'false la saca del juego y del progreso',
  })
  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}

export class ElementoActividadEntradaDto {
  @ApiProperty({ example: '14' }) @IsIdNumerico() contenidoId: string;

  @ApiPropertyOptional({ example: 'OPCION', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  rolEnJuego?: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(ORDEN_MAXIMO)
  orden?: number;

  @ApiPropertyOptional({ example: 'avión', maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  palabra?: string;

  @ApiPropertyOptional({
    example: '14',
    description:
      'Contenido IMAGEN del módulo. Si falta, se usa contenidoId (si es IMAGEN).',
  })
  @IsOptional()
  @IsIdNumerico()
  imagenContenidoId?: string;

  @ApiPropertyOptional({
    example: '15',
    description: 'IMAGEN, ANIMACION o VIDEO del módulo',
  })
  @IsOptional()
  @IsIdNumerico()
  kinemaContenidoId?: string;

  @ApiPropertyOptional({ example: '16', description: 'AUDIO del módulo' })
  @IsOptional()
  @IsIdNumerico()
  audioContenidoId?: string;
}

export class ReemplazarElementosDto {
  @ApiProperty({
    type: [ElementoActividadEntradaDto],
    maxItems: MAXIMO_ELEMENTOS,
  })
  @IsArray()
  @ArrayMaxSize(MAXIMO_ELEMENTOS)
  @ValidateNested({ each: true })
  @Type(() => ElementoActividadEntradaDto)
  elementos: ElementoActividadEntradaDto[];
}
