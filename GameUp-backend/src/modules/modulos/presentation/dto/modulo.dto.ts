import { ApiProperty } from '@nestjs/swagger';
import {
  CODIGOS_JUEGO,
  type CodigoJuego,
} from '../../../catalogo/domain/juegos/estrategia-juego.js';
import {
  NivelDto,
  PersonaDto,
} from '../../../estudiantes/presentation/dto/estudiante.dto.js';
import {
  TIPOS_CONTENIDO,
  type TipoContenido,
} from '../../domain/modulo.entity.js';

export class ModuloDto {
  @ApiProperty({ example: '3' }) id: string;
  @ApiProperty({ example: 'Vocal A' }) nombre: string;
  @ApiProperty({
    example: 'Reconocer y decir la a',
    nullable: true,
    type: String,
  })
  descripcion: string | null;
  @ApiProperty({ type: NivelDto, description: 'Categoría { id, nombre }' })
  categoria: NivelDto;
  @ApiProperty({ type: NivelDto }) nivel: NivelDto;
  @ApiProperty({ type: PersonaDto }) creadoPor: PersonaDto;
  @ApiProperty({ example: null, nullable: true, type: String }) musicaId:
    string | null;
  @ApiProperty({
    example: '14',
    nullable: true,
    type: String,
    description:
      'Contenido IMAGEN que sirve de portada (pide su URL con /contenidos/:id/url)',
  })
  portadaContenidoId: string | null;
  @ApiProperty({ example: false }) publicado: boolean;
  @ApiProperty({ example: 0 }) orden: number;
  @ApiProperty({ example: '2026-11-05T15:00:00.000Z' }) creadoEn: string;
}

export class PaginaModulosDto {
  @ApiProperty({ type: [ModuloDto] }) items: ModuloDto[];
  @ApiProperty({ example: 4 }) total: number;
  @ApiProperty({ example: 1 }) page: number;
  @ApiProperty({ example: 20 }) limit: number;
}

/** Sin la ruta de Storage: el archivo se pide con una URL firmada. */
export class ContenidoDto {
  @ApiProperty({ example: '14' }) id: string;
  @ApiProperty({ example: '3' }) moduloId: string;
  @ApiProperty({ enum: TIPOS_CONTENIDO, example: 'VIDEO' }) tipo: TipoContenido;
  @ApiProperty({ example: 'Mira cómo se dice la a' }) titulo: string;
  @ApiProperty({ example: 0 }) orden: number;
}

export class UrlFirmadaDto {
  @ApiProperty({
    example: 'https://TU_REF.supabase.co/storage/v1/object/sign/contenidos/...',
  })
  url: string;
  @ApiProperty({ example: '2026-11-05T16:00:00.000Z' }) expiraEn: string;
}

export class ContenidoUrlDto extends UrlFirmadaDto {
  @ApiProperty({ example: '14' }) contenidoId: string;
}

export class TipoJuegoResumenDto {
  @ApiProperty({ example: '5' }) id: string;
  @ApiProperty({ enum: CODIGOS_JUEGO, example: 'HABLA_CONMIGO' })
  codigo: CodigoJuego;
  @ApiProperty({ example: 'Habla conmigo' }) nombre: string;
}

export class ActividadDto {
  @ApiProperty({ example: '8' }) id: string;
  @ApiProperty({ example: '3' }) moduloId: string;
  @ApiProperty({ type: TipoJuegoResumenDto }) tipoJuego: TipoJuegoResumenDto;
  @ApiProperty({ example: 'Di la a' }) titulo: string;
  @ApiProperty({
    example: 'Mira el video y repite',
    nullable: true,
    type: String,
  })
  instruccionTexto: string | null;
  @ApiProperty({
    example: { vocal: 'a' },
    type: 'object',
    additionalProperties: true,
    description: 'Depende del tipo de juego (HABLA_CONMIGO: { vocal })',
  })
  configuracion: Record<string, unknown>;
  @ApiProperty({ example: 0 }) orden: number;
  @ApiProperty({ example: true }) activa: boolean;
}

export class ElementoActividadDto {
  @ApiProperty({ example: '14' }) contenidoId: string;
  @ApiProperty({ example: 'OPCION', nullable: true, type: String }) rolEnJuego:
    string | null;
  @ApiProperty({ example: 0 }) orden: number;
  @ApiProperty({ example: 'avión', nullable: true, type: String }) palabra:
    string | null;
  @ApiProperty({ example: '14', nullable: true, type: String })
  imagenContenidoId: string | null;
  @ApiProperty({ example: null, nullable: true, type: String })
  kinemaContenidoId: string | null;
  @ApiProperty({ example: null, nullable: true, type: String })
  audioContenidoId: string | null;
}

export class ActividadDetalleDto extends ActividadDto {
  @ApiProperty({ type: [ElementoActividadDto] })
  elementos: ElementoActividadDto[];
}
