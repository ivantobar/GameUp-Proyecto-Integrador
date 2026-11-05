import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles, UsuarioActual } from '../../../common/auth/decoradores.js';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import { aBigInt } from '../../../common/ids/ids.js';
import { mapearPagina } from '../../../common/paginacion/paginacion.js';
import { ParseBigIntPipe } from '../../../common/pipes/parse-bigint.pipe.js';
import { ApiErrores } from '../../../docs/api-errores.js';
import { BEARER_AUTH } from '../../../docs/swagger.js';
import { ModuloService } from '../application/modulo.service.js';
import { ModuloMapper } from '../infrastructure/modulo.mapper.js';
import {
  ActualizarModuloDto,
  CrearModuloDto,
  ListarModulosQueryDto,
} from './dto/modulo-entrada.dto.js';
import { ModuloDto, PaginaModulosDto } from './dto/modulo.dto.js';

/** undefined → no cambiar (null); null → 'borrar'; texto → id. */
function idOBorrar(valor: string | null | undefined): bigint | null | 'borrar' {
  if (valor === undefined) return null;
  return valor === null ? 'borrar' : aBigInt(valor);
}

@ApiTags('modulos')
@ApiBearerAuth(BEARER_AUTH)
@Controller('modulos')
export class ModuloController {
  constructor(private readonly modulos: ModuloService) {}

  @Get()
  @Roles('DIRECTORA', 'TALLERISTA')
  @ApiOperation({
    summary: 'Módulos (directora: todos; tallerista: publicados y los suyos)',
  })
  @ApiOkResponse({ type: PaginaModulosDto })
  @ApiErrores(400, 401, 403)
  async listar(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Query() q: ListarModulosQueryDto,
  ): Promise<PaginaModulosDto> {
    const pagina = await this.modulos.listar(
      actual,
      {
        categoriaId: q.categoriaId ? aBigInt(q.categoriaId) : null,
        nivelId: q.nivelId ? aBigInt(q.nivelId) : null,
        publicado: q.publicado ?? null,
      },
      { page: q.page, limit: q.limit },
    );
    return mapearPagina(pagina, ModuloMapper.aModuloDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Ver un módulo',
    description:
      'Estudiante y acudiente: solo si está asignado (a él o a uno de sus estudiantes). Si no, 404.',
  })
  @ApiOkResponse({ type: ModuloDto })
  @ApiErrores(400, 401, 403, 404)
  async obtener(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
  ): Promise<ModuloDto> {
    return ModuloMapper.aModuloDto(await this.modulos.obtener(actual, id));
  }

  @Post()
  @Roles('DIRECTORA', 'TALLERISTA')
  @ApiOperation({ summary: 'Crear un módulo (nace sin publicar)' })
  @ApiCreatedResponse({ type: ModuloDto })
  @ApiErrores(400, 401, 403, {
    422: 'La categoría, el nivel o la música no existen',
  })
  async crear(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Body() dto: CrearModuloDto,
  ): Promise<ModuloDto> {
    const modulo = await this.modulos.crear(actual, {
      categoriaId: aBigInt(dto.categoriaId),
      nivelId: aBigInt(dto.nivelId),
      musicaId: dto.musicaId ? aBigInt(dto.musicaId) : null,
      nombre: dto.nombre,
      descripcion: dto.descripcion?.trim() || null,
      orden: dto.orden ?? 0,
    });
    return ModuloMapper.aModuloDto(modulo);
  }

  @Patch(':id')
  @Roles('DIRECTORA', 'TALLERISTA')
  @ApiOperation({
    summary: 'Modificar un módulo (directora o quien lo creó)',
    description:
      'musicaId, descripcion y portadaContenidoId en null se vacían.',
  })
  @ApiOkResponse({ type: ModuloDto })
  @ApiErrores(400, 401, 403, 404, {
    422: 'Referencias inválidas o portada que no es IMAGEN del módulo',
  })
  async actualizar(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: ActualizarModuloDto,
  ): Promise<ModuloDto> {
    const modulo = await this.modulos.actualizar(actual, id, {
      categoriaId: dto.categoriaId ? aBigInt(dto.categoriaId) : null,
      nivelId: dto.nivelId ? aBigInt(dto.nivelId) : null,
      nombre: dto.nombre ?? null,
      orden: dto.orden ?? null,
      musicaId: idOBorrar(dto.musicaId),
      portadaContenidoId: idOBorrar(dto.portadaContenidoId),
      descripcion:
        dto.descripcion === undefined
          ? null
          : dto.descripcion === null || dto.descripcion.trim() === ''
            ? 'borrar'
            : dto.descripcion.trim(),
    });
    return ModuloMapper.aModuloDto(modulo);
  }

  @Delete(':id')
  @Roles('DIRECTORA', 'TALLERISTA')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un módulo (directora o quien lo creó)',
    description:
      'Solo si no tiene asignaciones. Borra también sus contenidos, actividades y archivos.',
  })
  @ApiNoContentResponse({ description: 'Módulo eliminado' })
  @ApiErrores(400, 401, 403, 404, { 409: 'Tiene asignaciones: despublícalo' })
  async eliminar(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
  ): Promise<void> {
    await this.modulos.eliminar(actual, id);
  }

  @Post(':id/publicacion')
  @Roles('DIRECTORA')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Publicar un módulo (directora)',
    description:
      'Solo los módulos publicados se pueden asignar. Necesita al menos una actividad activa.',
  })
  @ApiOkResponse({ type: ModuloDto })
  @ApiErrores(400, 401, 403, 404, { 422: 'No tiene actividades activas' })
  async publicar(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
  ): Promise<ModuloDto> {
    return ModuloMapper.aModuloDto(
      await this.modulos.publicar(actual, id, true),
    );
  }

  @Delete(':id/publicacion')
  @Roles('DIRECTORA')
  @ApiOperation({
    summary: 'Despublicar un módulo (directora)',
    description:
      'Las asignaciones que ya existen siguen; no se pueden crear nuevas.',
  })
  @ApiOkResponse({ type: ModuloDto })
  @ApiErrores(400, 401, 403, 404)
  async despublicar(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
  ): Promise<ModuloDto> {
    return ModuloMapper.aModuloDto(
      await this.modulos.publicar(actual, id, false),
    );
  }
}
