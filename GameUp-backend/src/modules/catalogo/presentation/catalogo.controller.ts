import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { idATexto } from '../../../common/ids/ids.js';
import { ApiErrores } from '../../../docs/api-errores.js';
import { BEARER_AUTH } from '../../../docs/swagger.js';
import { CatalogoService } from '../application/catalogo.service.js';
import {
  CODIGOS_JUEGO,
  type CodigoJuego,
} from '../domain/juegos/estrategia-juego.js';

export class NivelCatalogoDto {
  @ApiProperty({ example: '1' }) id: string;
  @ApiProperty({ example: 'BAJO' }) nombre: string;
  @ApiProperty({ example: 'Poco desarrollo', nullable: true, type: String })
  descripcion: string | null;
  @ApiProperty({ example: 1 }) orden: number;
}

export class CategoriaDto {
  @ApiProperty({ example: '1' }) id: string;
  @ApiProperty({ example: 'VOCALES' }) nombre: string;
  @ApiProperty({
    example: 'Vocales con el Método Ventura',
    nullable: true,
    type: String,
  })
  descripcion: string | null;
  @ApiProperty({ example: null, nullable: true, type: String }) iconoUrl:
    string | null;
}

export class TipoJuegoDto {
  @ApiProperty({ example: '5' }) id: string;
  @ApiProperty({ enum: CODIGOS_JUEGO, example: 'HABLA_CONMIGO' })
  codigo: CodigoJuego;
  @ApiProperty({ example: 'Habla conmigo' }) nombre: string;
  @ApiProperty({
    example: 'Practicar vocales con los pasos Mira, Dilo y Listo',
    nullable: true,
    type: String,
  })
  descripcion: string | null;
}

export class MusicaDto {
  @ApiProperty({ example: '1' }) id: string;
  @ApiProperty({ example: 'Canon en re' }) titulo: string;
  @ApiProperty({ example: 'Pachelbel', nullable: true, type: String }) autor:
    string | null;
  @ApiProperty({ enum: ['CLASICA', 'INFANTIL'], example: 'CLASICA' })
  tipo: string;
  @ApiProperty({ example: 'https://ejemplo.com/canon.mp3' }) urlAudio: string;
}

/** Catálogo de solo lectura (cualquier persona con sesión). */
@ApiTags('catalogo')
@ApiBearerAuth(BEARER_AUTH)
@Controller()
export class CatalogoController {
  constructor(private readonly catalogo: CatalogoService) {}

  @Get('niveles')
  @ApiOperation({ summary: 'Niveles (BAJO, MEDIO, ALTO)' })
  @ApiOkResponse({ type: [NivelCatalogoDto] })
  @ApiErrores(401, 403)
  async niveles(): Promise<NivelCatalogoDto[]> {
    return (await this.catalogo.niveles()).map((n) => ({
      ...n,
      id: idATexto(n.id),
    }));
  }

  @Get('categorias')
  @ApiOperation({ summary: 'Categorías de módulos (VOCALES, PRAXIAS)' })
  @ApiOkResponse({ type: [CategoriaDto] })
  @ApiErrores(401, 403)
  async categorias(): Promise<CategoriaDto[]> {
    return (await this.catalogo.categorias()).map((c) => ({
      ...c,
      id: idATexto(c.id),
    }));
  }

  @Get('tipos-juego')
  @ApiOperation({ summary: 'Tipos de juego del MVP' })
  @ApiOkResponse({ type: [TipoJuegoDto] })
  @ApiErrores(401, 403)
  async tiposJuego(): Promise<TipoJuegoDto[]> {
    return (await this.catalogo.tiposJuego()).map((t) => ({
      ...t,
      id: idATexto(t.id),
    }));
  }

  @Get('musica')
  @ApiOperation({
    summary: 'Música de fondo disponible para los módulos (solo la activa)',
  })
  @ApiOkResponse({ type: [MusicaDto] })
  @ApiErrores(401, 403)
  async musica(): Promise<MusicaDto[]> {
    return (await this.catalogo.musicaDisponible()).map(
      ({ activa: _a, ...m }) => ({
        ...m,
        id: idATexto(m.id),
      }),
    );
  }
}
