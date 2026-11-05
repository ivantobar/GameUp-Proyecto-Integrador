import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { AsignacionService } from '../application/asignacion.service.js';
import { AvanceAsignacionService } from '../application/avance-asignacion.service.js';
import { AsignacionMapper } from '../infrastructure/asignacion.mapper.js';
import {
  ActividadPendienteDto,
  AsignacionDetalleDto,
  AsignacionDto,
  CrearAsignacionDto,
  ListarAsignacionesQueryDto,
  PaginaAsignacionesDto,
} from './dto/asignacion.dto.js';

@ApiTags('asignaciones')
@ApiBearerAuth(BEARER_AUTH)
@Controller('asignaciones')
export class AsignacionController {
  constructor(
    private readonly asignaciones: AsignacionService,
    private readonly avance: AvanceAsignacionService,
  ) {}

  @Post()
  @Roles('DIRECTORA', 'TALLERISTA')
  @ApiOperation({
    summary: 'Asignar un módulo publicado a un estudiante',
    description:
      'Tallerista: solo a estudiantes a cargo (si no, 404). Avisa a los acudientes.',
  })
  @ApiCreatedResponse({ type: AsignacionDto })
  @ApiErrores(400, 401, 403, 404, {
    409: 'Ya tiene ese módulo asignado sin completar',
    422: 'Módulo sin publicar o inexistente, estudiante no activo o fecha pasada',
  })
  async crear(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Body() dto: CrearAsignacionDto,
  ): Promise<AsignacionDto> {
    const asignacion = await this.asignaciones.crear(actual, {
      moduloId: aBigInt(dto.moduloId),
      estudianteId: aBigInt(dto.estudianteId),
      fechaSugerida: dto.fechaSugerida ?? null,
    });
    return AsignacionMapper.aDto(asignacion);
  }

  @Get()
  @ApiOperation({
    summary: 'Asignaciones de los estudiantes que puedo ver',
    description:
      'Directora: todas. Tallerista: de sus estudiantes. Acudiente: de los suyos. Estudiante: las propias.',
  })
  @ApiOkResponse({ type: PaginaAsignacionesDto })
  @ApiErrores(400, 401, 403)
  async listar(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Query() q: ListarAsignacionesQueryDto,
  ): Promise<PaginaAsignacionesDto> {
    const pagina = await this.asignaciones.listar(
      actual,
      {
        estudianteId: q.estudianteId ? aBigInt(q.estudianteId) : null,
        moduloId: q.moduloId ? aBigInt(q.moduloId) : null,
        estado: q.estado ?? null,
      },
      { page: q.page, limit: q.limit },
    );
    return mapearPagina(pagina, AsignacionMapper.aDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Avance de una asignación',
    description:
      'Estado de cada actividad activa. Solo las APROBADAS cuentan para el progreso; las pendientes se informan aparte.',
  })
  @ApiOkResponse({ type: AsignacionDetalleDto })
  @ApiErrores(400, 401, 403, 404)
  async detalle(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
  ): Promise<AsignacionDetalleDto> {
    return AsignacionMapper.aDetalleDto(await this.avance.detalle(actual, id));
  }

  @Delete(':id')
  @Roles('DIRECTORA', 'TALLERISTA')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Quitar una asignación (solo si no tiene intentos)',
  })
  @ApiNoContentResponse({ description: 'Asignación eliminada' })
  @ApiErrores(400, 401, 403, 404, { 409: 'El estudiante ya hizo intentos' })
  async eliminar(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
  ): Promise<void> {
    await this.asignaciones.eliminar(actual, id);
  }
}

/** Lo que el estudiante con sesión tiene por hacer. */
@ApiTags('asignaciones')
@ApiBearerAuth(BEARER_AUTH)
@Controller('estudiantes')
export class PendientesController {
  constructor(private readonly avance: AvanceAsignacionService) {}

  @Get('me/actividades-pendientes')
  @Roles('ESTUDIANTE')
  @ApiOperation({
    summary: 'Mis actividades pendientes (estudiante)',
    description:
      'Actividades activas de mis módulos sin completar que no he hecho o que me pidieron repetir.',
  })
  @ApiOkResponse({ type: [ActividadPendienteDto] })
  @ApiErrores(401, 403)
  async pendientes(
    @UsuarioActual() actual: UsuarioAutenticado,
  ): Promise<ActividadPendienteDto[]> {
    return (await this.avance.pendientesDelEstudiante(actual)).map(
      AsignacionMapper.aPendienteDto,
    );
  }
}
