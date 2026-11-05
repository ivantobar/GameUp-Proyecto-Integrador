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
import { aBigInt } from '../../../common/ids/ids.js';
import { mapearPagina } from '../../../common/paginacion/paginacion.js';
import { ParseBigIntPipe } from '../../../common/pipes/parse-bigint.pipe.js';
import { ApiErrores } from '../../../docs/api-errores.js';
import { BEARER_AUTH } from '../../../docs/swagger.js';
import { UsuarioService } from '../application/usuario.service.js';
import { UsuarioMapper } from '../infrastructure/usuario.mapper.js';
import { CrearUsuarioDto } from './dto/crear-usuario.dto.js';
import { PaginaUsuariosDto, UsuarioDto } from './dto/usuario.dto.js';
import {
  CambiarEstadoUsuarioDto,
  ListarUsuariosQueryDto,
} from './dto/usuarios-query.dto.js';

/** Cuentas de GameUP. Solo la directora. */
@ApiTags('usuarios')
@ApiBearerAuth(BEARER_AUTH)
@Roles('DIRECTORA')
@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarios: UsuarioService) {}

  @Post()
  @ApiOperation({
    summary: 'Dar de alta una cuenta (directora)',
    description:
      'Crea la copia mínima de una persona que ya existe en la API de seguridad. ' +
      'Para ESTUDIANTE crea también su fila en estudiante (nivel inicial BAJO si no se indica).',
  })
  @ApiCreatedResponse({ type: UsuarioDto })
  @ApiErrores(400, 401, 403, {
    409: 'Ya existe una cuenta con ese id, correo o id externo',
    422: 'Los datos no cumplen las reglas del rol (ej.: estudiante sin idEstudianteExterno)',
  })
  async crear(@Body() dto: CrearUsuarioDto): Promise<UsuarioDto> {
    const usuario = await this.usuarios.crear({
      idUsuarioAuth: aBigInt(dto.idUsuarioAuth),
      rol: dto.rol,
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      correo: dto.correo ?? null,
      idAcudienteExterno: dto.idAcudienteExterno
        ? aBigInt(dto.idAcudienteExterno)
        : null,
      idEstudianteExterno: dto.idEstudianteExterno
        ? aBigInt(dto.idEstudianteExterno)
        : null,
      nivelId: dto.nivelId ? aBigInt(dto.nivelId) : null,
    });
    return UsuarioMapper.aDto(usuario);
  }

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
