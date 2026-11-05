import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { ArchivoSubido } from '../../../common/almacenamiento/almacen-archivos.js';
import { SubidaDeArchivo } from '../../../common/almacenamiento/subidas.js';
import { Roles, UsuarioActual } from '../../../common/auth/decoradores.js';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import { ParseBigIntPipe } from '../../../common/pipes/parse-bigint.pipe.js';
import { ApiErrores } from '../../../docs/api-errores.js';
import { BEARER_AUTH } from '../../../docs/swagger.js';
import { ContenidoService } from '../application/contenido.service.js';
import { TIPOS_CONTENIDO } from '../domain/modulo.entity.js';
import { ModuloMapper } from '../infrastructure/modulo.mapper.js';
import {
  ActualizarContenidoDto,
  SubirContenidoDto,
} from './dto/modulo-entrada.dto.js';
import {
  ContenidoDto,
  ContenidoUrlDto,
  UrlFirmadaDto,
} from './dto/modulo.dto.js';

/** Igual que el límite del bucket `contenidos` (MP4 de hasta 50 MB). */
export const TAMANO_MAXIMO_CONTENIDO = 50 * 1024 * 1024;

@ApiTags('modulos')
@ApiBearerAuth(BEARER_AUTH)
@Controller()
export class ContenidoController {
  constructor(private readonly contenidos: ContenidoService) {}

  @Get('modulos/:id/contenidos')
  @ApiOperation({
    summary: 'Contenidos de un módulo (sin rutas: pide URLs firmadas)',
  })
  @ApiOkResponse({ type: [ContenidoDto] })
  @ApiErrores(400, 401, 403, 404)
  async listar(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
  ): Promise<ContenidoDto[]> {
    return (await this.contenidos.listar(actual, id)).map(
      ModuloMapper.aContenidoDto,
    );
  }

  @Get('modulos/:id/contenidos/urls')
  @ApiOperation({
    summary: 'URLs firmadas de todos los contenidos del módulo (60 min)',
    description:
      'Una sola llamada para cargar un juego. Mismo acceso que ver el módulo.',
  })
  @ApiOkResponse({ type: [ContenidoUrlDto] })
  @ApiErrores(400, 401, 403, 404, 503)
  async urls(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
  ): Promise<ContenidoUrlDto[]> {
    return (await this.contenidos.urlsDelModulo(actual, id)).map(
      ModuloMapper.aContenidoUrlDto,
    );
  }

  @Post('modulos/:id/contenidos')
  @Roles('DIRECTORA', 'TALLERISTA')
  // A disco temporal (nunca 50 MB en memoria); el temporal se borra siempre.
  @SubidaDeArchivo('archivo', TAMANO_MAXIMO_CONTENIDO)
  @ApiOperation({
    summary: 'Subir un contenido (directora o quien creó el módulo)',
    description:
      'VIDEO: MP4 · IMAGEN: PNG, JPEG o WEBP · AUDIO: MP3 o M4A · ANIMACION: MP4 o WEBP. ' +
      'Máximo 50 MB. El formato se comprueba por el contenido del archivo.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['archivo', 'tipo', 'titulo'],
      properties: {
        archivo: { type: 'string', format: 'binary' },
        tipo: { type: 'string', enum: [...TIPOS_CONTENIDO], example: 'VIDEO' },
        titulo: { type: 'string', example: 'Mira cómo se dice la a' },
        orden: { type: 'integer', example: 0 },
      },
    },
  })
  @ApiCreatedResponse({ type: ContenidoDto })
  @ApiPayloadTooLargeResponse({ description: 'El archivo pasa de 50 MB' })
  @ApiErrores(400, 401, 403, 404, {
    422: 'El formato no es válido o no corresponde al tipo',
    503: 'El almacenamiento no está disponible',
  })
  async subir(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: SubirContenidoDto,
    @UploadedFile() archivo: ArchivoSubido | undefined,
  ): Promise<ContenidoDto> {
    if (!archivo) {
      throw new BadRequestException(['Falta el archivo (campo "archivo").']);
    }
    const contenido = await this.contenidos.subir(
      actual,
      id,
      { tipo: dto.tipo, titulo: dto.titulo, orden: dto.orden ?? 0 },
      archivo,
    );
    return ModuloMapper.aContenidoDto(contenido);
  }

  @Get('contenidos/:id/url')
  @ApiOperation({
    summary: 'URL firmada de un contenido (60 min)',
    description:
      'Estudiante y acudiente: solo si el módulo está asignado. Si no, 404.',
  })
  @ApiOkResponse({ type: UrlFirmadaDto })
  @ApiErrores(400, 401, 403, 404, 503)
  async url(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
  ): Promise<UrlFirmadaDto> {
    return ModuloMapper.aUrlDto(await this.contenidos.url(actual, id));
  }

  @Patch('contenidos/:id')
  @Roles('DIRECTORA', 'TALLERISTA')
  @ApiOperation({ summary: 'Cambiar título u orden de un contenido' })
  @ApiOkResponse({ type: ContenidoDto })
  @ApiErrores(400, 401, 403, 404)
  async actualizar(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: ActualizarContenidoDto,
  ): Promise<ContenidoDto> {
    const contenido = await this.contenidos.actualizar(actual, id, {
      titulo: dto.titulo ?? null,
      orden: dto.orden ?? null,
    });
    return ModuloMapper.aContenidoDto(contenido);
  }

  @Delete('contenidos/:id')
  @Roles('DIRECTORA', 'TALLERISTA')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un contenido y su archivo' })
  @ApiNoContentResponse({ description: 'Contenido eliminado' })
  @ApiErrores(400, 401, 403, 404, {
    409: 'Una actividad lo usa o es la portada',
  })
  async eliminar(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
  ): Promise<void> {
    await this.contenidos.eliminar(actual, id);
  }
}
