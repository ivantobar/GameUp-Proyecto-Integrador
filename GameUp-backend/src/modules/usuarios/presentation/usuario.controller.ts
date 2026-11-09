import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles, UsuarioActual } from '../../../common/auth/decoradores.js';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import { mapearPagina } from '../../../common/paginacion/paginacion.js';
import { ParseBigIntPipe } from '../../../common/pipes/parse-bigint.pipe.js';
import { ApiErrores } from '../../../docs/api-errores.js';
import { BEARER_AUTH } from '../../../docs/swagger.js';
import { UsuarioService } from '../application/usuario.service.js';
import { UsuarioMapper } from '../infrastructure/usuario.mapper.js';
import { PaginaUsuariosDto, UsuarioDto } from './dto/usuario.dto.js';
import {
  CambiarEstadoUsuarioDto,
  ListarUsuariosQueryDto,
} from './dto/usuarios-query.dto.js';

/**
 * Cuentas de GameUP. Solo la directora. El alta (POST /usuarios) está en
 * AuthModule (AltaUsuarioController): consulta la API central y ASISCO UP.
 */
@ApiTags('usuarios')
@ApiBearerAuth(BEARER_AUTH)
@Roles('DIRECTORA')
@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarios: UsuarioService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar cuentas (directora), con filtros y paginación',
  })
  @ApiOkResponse({ type: PaginaUsuariosDto })
  @ApiErrores(400, 401, 403)
  async listar(@Query() q: ListarUsuariosQueryDto): Promise<PaginaUsuariosDto> {
    const pagina = await this.usuarios.listar(
      { rol: q.rol ?? null, activo: q.activo ?? null },
      { page: q.page, limit: q.limit },
    );
    return mapearPagina(pagina, UsuarioMapper.aDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver una cuenta (directora)' })
  @ApiOkResponse({ type: UsuarioDto })
  @ApiErrores(400, 401, 403, 404)
  async obtener(@Param('id', ParseBigIntPipe) id: bigint): Promise<UsuarioDto> {
    return UsuarioMapper.aDto(await this.usuarios.obtener(id));
  }

  @Patch(':id/estado')
  @ApiOperation({
    summary: 'Activar o desactivar una cuenta (directora)',
    description:
      'Una cuenta inactiva recibe 403 en cualquier ruta. No puedes desactivar tu propia cuenta.',
  })
  @ApiOkResponse({ type: UsuarioDto })
  @ApiErrores(400, 401, 403, 404, {
    422: 'No puedes desactivar tu propia cuenta',
  })
  async cambiarEstado(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: CambiarEstadoUsuarioDto,
  ): Promise<UsuarioDto> {
    return UsuarioMapper.aDto(
      await this.usuarios.cambiarEstado(actual, id, dto.activo),
    );
  }
}
