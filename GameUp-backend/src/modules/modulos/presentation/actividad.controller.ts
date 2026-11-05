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
  Put,
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
import { ParseBigIntPipe } from '../../../common/pipes/parse-bigint.pipe.js';
import { ApiErrores } from '../../../docs/api-errores.js';
import { BEARER_AUTH } from '../../../docs/swagger.js';
import { ActividadService } from '../application/actividad.service.js';
import { ModuloMapper } from '../infrastructure/modulo.mapper.js';
import {
  ActualizarActividadDto,
  CrearActividadDto,
  ReemplazarElementosDto,
} from './dto/modulo-entrada.dto.js';
import {
  ActividadDetalleDto,
  ActividadDto,
  ElementoActividadDto,
} from './dto/modulo.dto.js';

const idONulo = (valor: string | undefined) => (valor ? aBigInt(valor) : null);

@ApiTags('modulos')
@ApiBearerAuth(BEARER_AUTH)
@Controller()
export class ActividadController {
  constructor(private readonly actividades: ActividadService) {}

  @Get('modulos/:id/actividades')
  @ApiOperation({
    summary: 'Actividades de un módulo',
    description:
      'Estudiante y acudiente: solo las activas de un módulo asignado.',
  })
  @ApiOkResponse({ type: [ActividadDto] })
  @ApiErrores(400, 401, 403, 404)
  async listar(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
  ): Promise<ActividadDto[]> {
    return (await this.actividades.listar(actual, id)).map(
      ModuloMapper.aActividadDto,
    );
  }

  @Post('modulos/:id/actividades')
  @Roles('DIRECTORA', 'TALLERISTA')
  @ApiOperation({
    summary: 'Crear una actividad (directora o quien creó el módulo)',
    description: 'La configuración se valida según el tipo de juego.',
  })
  @ApiCreatedResponse({ type: ActividadDto })
  @ApiErrores(400, 401, 403, 404, {
    422: 'Configuración inválida para el tipo de juego',
  })
  async crear(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: CrearActividadDto,
  ): Promise<ActividadDto> {
    const actividad = await this.actividades.crear(actual, id, {
      tipoJuego: dto.tipoJuego,
      titulo: dto.titulo,
      instruccionTexto: dto.instruccionTexto ?? null,
      configuracion: dto.configuracion ?? {},
      orden: dto.orden ?? 0,
      activa: dto.activa ?? true,
    });
    return ModuloMapper.aActividadDto(actividad);
  }

  @Get('actividades/:id')
  @ApiOperation({ summary: 'Ver una actividad con sus contenidos' })
  @ApiOkResponse({ type: ActividadDetalleDto })
  @ApiErrores(400, 401, 403, 404)
  async obtener(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
  ): Promise<ActividadDetalleDto> {
    const { actividad, elementos } = await this.actividades.obtener(actual, id);
    return {
      ...ModuloMapper.aActividadDto(actividad),
      elementos: elementos.map(ModuloMapper.aElementoDto),
    };
  }

  @Patch('actividades/:id')
  @Roles('DIRECTORA', 'TALLERISTA')
  @ApiOperation({
    summary: 'Modificar una actividad',
    description:
      'El tipo de juego no cambia. activa = false la saca del juego y del progreso.',
  })
  @ApiOkResponse({ type: ActividadDto })
  @ApiErrores(400, 401, 403, 404, {
    422: 'Configuración inválida para el tipo de juego',
  })
  async actualizar(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: ActualizarActividadDto,
  ): Promise<ActividadDto> {
    const actividad = await this.actividades.actualizar(actual, id, {
      titulo: dto.titulo ?? null,
      instruccionTexto:
        dto.instruccionTexto === undefined
          ? null
          : dto.instruccionTexto === null || dto.instruccionTexto.trim() === ''
            ? 'borrar'
            : dto.instruccionTexto.trim(),
      configuracion: dto.configuracion ?? null,
      orden: dto.orden ?? null,
      activa: dto.activa ?? null,
    });
    return ModuloMapper.aActividadDto(actividad);
  }

  @Delete('actividades/:id')
  @Roles('DIRECTORA', 'TALLERISTA')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar una actividad (solo si no tiene intentos)',
  })
  @ApiNoContentResponse({ description: 'Actividad eliminada' })
  @ApiErrores(400, 401, 403, 404, { 409: 'Tiene intentos: desactívala' })
  async eliminar(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
  ): Promise<void> {
    await this.actividades.eliminar(actual, id);
  }

  @Put('actividades/:id/contenidos')
  @Roles('DIRECTORA', 'TALLERISTA')
  @ApiOperation({
    summary: 'Reemplazar los contenidos de una actividad',
    description:
      'Todos deben ser del mismo módulo. imagen: IMAGEN · kinema: IMAGEN, ANIMACION o VIDEO · audio: AUDIO.',
  })
  @ApiOkResponse({ type: [ElementoActividadDto] })
  @ApiErrores(400, 401, 403, 404, {
    422: 'Contenido de otro módulo, repetido o de tipo incorrecto',
  })
  async reemplazarElementos(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: ReemplazarElementosDto,
  ): Promise<ElementoActividadDto[]> {
    const elementos = await this.actividades.reemplazarElementos(
      actual,
      id,
      dto.elementos.map((e) => ({
        contenidoId: aBigInt(e.contenidoId),
        rolEnJuego: e.rolEnJuego ?? null,
        orden: e.orden ?? 0,
        palabra: e.palabra ?? null,
        imagenContenidoId: idONulo(e.imagenContenidoId),
        kinemaContenidoId: idONulo(e.kinemaContenidoId),
        audioContenidoId: idONulo(e.audioContenidoId),
      })),
    );
    return elementos.map(ModuloMapper.aElementoDto);
  }
}
