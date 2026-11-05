import {
  Controller,
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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UsuarioActual } from '../../../common/auth/decoradores.js';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import { mapearPagina } from '../../../common/paginacion/paginacion.js';
import { ParseBigIntPipe } from '../../../common/pipes/parse-bigint.pipe.js';
import { ApiErrores } from '../../../docs/api-errores.js';
import { BEARER_AUTH } from '../../../docs/swagger.js';
import { NotificacionService } from '../application/notificacion.service.js';
import { NotificacionMapper } from '../infrastructure/notificacion.mapper.js';
import {
  ListarNotificacionesQueryDto,
  NotificacionDto,
  NotificacionesMarcadasDto,
  PaginaNotificacionesDto,
} from './dto/notificacion.dto.js';

/** Mis avisos (cualquier rol; solo los propios). */
@ApiTags('notificaciones')
@ApiBearerAuth(BEARER_AUTH)
@Controller('notificaciones')
export class NotificacionController {
  constructor(private readonly notificaciones: NotificacionService) {}

  @Get()
  @ApiOperation({
    summary: 'Mis notificaciones (la más reciente primero)',
    description: 'Incluye cuántas hay sin leer en total.',
  })
  @ApiOkResponse({ type: PaginaNotificacionesDto })
  @ApiErrores(400, 401, 403)
  async listar(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Query() q: ListarNotificacionesQueryDto,
  ): Promise<PaginaNotificacionesDto> {
    const { pagina, noLeidas } = await this.notificaciones.listar(
      actual,
      q.leida ?? null,
      { page: q.page, limit: q.limit },
    );
    return { ...mapearPagina(pagina, NotificacionMapper.aDto), noLeidas };
  }

  @Patch(':id/lectura')
  @ApiOperation({
    summary: 'Marcar una notificación como leída',
    description: 'Idempotente. La de otra persona → 404.',
  })
  @ApiOkResponse({ type: NotificacionDto })
  @ApiErrores(400, 401, 403, 404)
  async marcarLeida(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
  ): Promise<NotificacionDto> {
    return NotificacionMapper.aDto(
      await this.notificaciones.marcarLeida(actual, id),
    );
  }

  @Post('lectura')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar todas mis notificaciones como leídas' })
  @ApiOkResponse({ type: NotificacionesMarcadasDto })
  @ApiErrores(401, 403)
  async marcarTodas(
    @UsuarioActual() actual: UsuarioAutenticado,
  ): Promise<NotificacionesMarcadasDto> {
    return { marcadas: await this.notificaciones.marcarTodasLeidas(actual) };
  }
}
