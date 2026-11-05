import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles, UsuarioActual } from '../../../common/auth/decoradores.js';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import {
  mapearPagina,
  PaginacionQueryDto,
} from '../../../common/paginacion/paginacion.js';
import { ParseBigIntPipe } from '../../../common/pipes/parse-bigint.pipe.js';
import { ApiErrores } from '../../../docs/api-errores.js';
import { BEARER_AUTH } from '../../../docs/swagger.js';
import { ObservacionService } from '../application/observacion.service.js';
import { ObservacionMapper } from '../infrastructure/observacion.mapper.js';
import {
  CrearObservacionDto,
  EditarObservacionDto,
  ObservacionDto,
  PaginaObservacionesDto,
} from './dto/observacion.dto.js';

/** Observaciones de seguimiento de un estudiante. */
@ApiTags('observaciones')
@ApiBearerAuth(BEARER_AUTH)
@Controller()
export class ObservacionController {
  constructor(private readonly observaciones: ObservacionService) {}

  @Get('estudiantes/:id/observaciones')
  @Roles('DIRECTORA', 'TALLERISTA', 'ACUDIENTE')
  @ApiOperation({
    summary: 'Observaciones de un estudiante (la más reciente primero)',
    description:
      'Directora y tallerista a cargo: todas. Acudiente: solo las visibles para él. Estudiante ajeno → 404.',
  })
  @ApiOkResponse({ type: PaginaObservacionesDto })
  @ApiErrores(400, 401, 403, 404)
  async listar(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() q: PaginacionQueryDto,
  ): Promise<PaginaObservacionesDto> {
    const pagina = await this.observaciones.listar(actual, id, {
      page: q.page,
      limit: q.limit,
    });
    return mapearPagina(pagina, ObservacionMapper.aDto);
  }

  @Post('estudiantes/:id/observaciones')
  @Roles('DIRECTORA', 'TALLERISTA')
  @ApiOperation({
    summary: 'Escribir una observación',
    description:
      'Directora o tallerista a cargo. Si es visible para el acudiente, la base le envía una notificación.',
  })
  @ApiCreatedResponse({ type: ObservacionDto })
  @ApiErrores(400, 401, 403, 404, { 422: 'El texto quedó vacío' })
  async crear(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: CrearObservacionDto,
  ): Promise<ObservacionDto> {
    const observacion = await this.observaciones.crear(
      actual,
      id,
      dto.texto,
      dto.visibleAcudiente ?? false,
    );
    return ObservacionMapper.aDto(observacion);
  }

  @Patch('observaciones/:id')
  @Roles('DIRECTORA', 'TALLERISTA')
  @ApiOperation({
    summary: 'Editar una observación',
    description:
      'Quien la escribió (mientras tenga al estudiante a cargo) o la directora. ' +
      'Al hacerla visible, el acudiente recibe una notificación.',
  })
  @ApiOkResponse({ type: ObservacionDto })
  @ApiErrores(400, 401, 404, {
    403: 'No es tu observación, o tu rol no escribe observaciones',
    422: 'No hay nada que cambiar o el texto quedó vacío',
  })
  async editar(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: EditarObservacionDto,
  ): Promise<ObservacionDto> {
    const observacion = await this.observaciones.editar(actual, id, {
      texto: dto.texto ?? null,
      visibleAcudiente: dto.visibleAcudiente ?? null,
    });
    return ObservacionMapper.aDto(observacion);
  }
}
