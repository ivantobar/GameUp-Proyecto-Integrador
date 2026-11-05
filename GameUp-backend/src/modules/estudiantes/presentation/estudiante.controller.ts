import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles, UsuarioActual } from '../../../common/auth/decoradores.js';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import { aBigInt } from '../../../common/ids/ids.js';
import {
  mapearPagina,
  PaginacionQueryDto,
} from '../../../common/paginacion/paginacion.js';
import { ParseBigIntPipe } from '../../../common/pipes/parse-bigint.pipe.js';
import { ApiErrores } from '../../../docs/api-errores.js';
import { BEARER_AUTH } from '../../../docs/swagger.js';
import { EstudianteService } from '../application/estudiante.service.js';
import { EstudianteMapper } from '../infrastructure/estudiante.mapper.js';
import {
  CambiarNivelDto,
  ListarEstudiantesQueryDto,
} from './dto/estudiante-entrada.dto.js';
import {
  EstudianteDetalleDto,
  EstudiantePropioDto,
  PaginaCambiosNivelDto,
  PaginaEstudiantesDto,
} from './dto/estudiante.dto.js';

@ApiTags('estudiantes')
@ApiBearerAuth(BEARER_AUTH)
@Controller('estudiantes')
export class EstudianteController {
  constructor(private readonly estudiantes: EstudianteService) {}

  @Get()
  @Roles('DIRECTORA', 'TALLERISTA', 'ACUDIENTE')
  @ApiOperation({
    summary: 'Estudiantes que puedo ver',
    description:
      'Directora: todos. Tallerista: los que tiene a cargo. Acudiente: los suyos.',
  })
  @ApiOkResponse({ type: PaginaEstudiantesDto })
  @ApiErrores(400, 401, 403)
  async listar(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Query() q: ListarEstudiantesQueryDto,
  ): Promise<PaginaEstudiantesDto> {
    const pagina = await this.estudiantes.listar(
      actual,
      {
        estado: q.estado ?? null,
        nivelId: q.nivelId ? aBigInt(q.nivelId) : null,
      },
      { page: q.page, limit: q.limit },
    );
    return mapearPagina(pagina, EstudianteMapper.aResumenDto);
  }

  // Va antes de ':id' para que "me" no se lea como id.
  @Get('me')
  @Roles('ESTUDIANTE')
  @ApiOperation({ summary: 'El estudiante con sesión' })
  @ApiOkResponse({ type: EstudiantePropioDto })
  @ApiErrores(401, 403)
  async propio(
    @UsuarioActual() actual: UsuarioAutenticado,
  ): Promise<EstudiantePropioDto> {
    return EstudianteMapper.aPropioDto(
      await this.estudiantes.obtenerPropio(actual),
    );
  }

  @Get(':id')
  @Roles('DIRECTORA', 'TALLERISTA', 'ACUDIENTE')
  @ApiOperation({
    summary: 'Ficha de un estudiante',
    description: 'Si el estudiante no te corresponde, la respuesta es 404.',
  })
  @ApiOkResponse({ type: EstudianteDetalleDto })
  @ApiErrores(400, 401, 403, 404)
  async obtener(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
  ): Promise<EstudianteDetalleDto> {
    return EstudianteMapper.aDetalleDto(
      await this.estudiantes.obtener(actual, id),
    );
  }

  @Get(':id/historial-nivel')
  @Roles('DIRECTORA', 'TALLERISTA', 'ACUDIENTE')
  @ApiOperation({ summary: 'Historial de cambios de nivel' })
  @ApiOkResponse({ type: PaginaCambiosNivelDto })
  @ApiErrores(400, 401, 403, 404)
  async historialNivel(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() q: PaginacionQueryDto,
  ): Promise<PaginaCambiosNivelDto> {
    const pagina = await this.estudiantes.historialNivel(actual, id, {
      page: q.page,
      limit: q.limit,
    });
    return mapearPagina(pagina, EstudianteMapper.cambioNivelADto);
  }

  @Put(':id/nivel')
  @Roles('DIRECTORA')
  @ApiOperation({
    summary: 'Cambiar el nivel (directora)',
    description:
      'Guarda el cambio en el historial y avisa a los acudientes (función cambiar_nivel).',
  })
  @ApiOkResponse({ type: EstudianteDetalleDto })
  @ApiErrores(400, 401, 403, 404, {
    422: 'El nivel no existe o el estudiante ya está en ese nivel',
  })
  async cambiarNivel(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: CambiarNivelDto,
  ): Promise<EstudianteDetalleDto> {
    const estudiante = await this.estudiantes.cambiarNivel(
      actual,
      id,
      aBigInt(dto.nivelId),
      dto.motivo ?? null,
    );
    return EstudianteMapper.aDetalleDto(estudiante);
  }
}
