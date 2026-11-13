import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles, UsuarioActual } from '../../../common/auth/decoradores.js';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import { ParseBigIntPipe } from '../../../common/pipes/parse-bigint.pipe.js';
import { ApiErrores } from '../../../docs/api-errores.js';
import { BEARER_AUTH } from '../../../docs/swagger.js';
import { JUEGOS_CON_ESCALERA } from '../../catalogo/domain/juegos/niveles-juego.js';
import { NivelJuegoService } from '../application/nivel-juego.service.js';
import { NivelJuegoMapper } from '../infrastructure/nivel-juego.mapper.js';
import {
  ActividadDelNivelDto,
  AjustarNivelJuegoDto,
  NivelJuegoDto,
} from './dto/nivel-juego.dto.js';

const PARAM_JUEGO = {
  name: 'juego',
  enum: JUEGOS_CON_ESCALERA,
  description: 'Juego con escalera de 5 niveles',
} as const;

/**
 * Escalera de niveles por juego (fase 9). Las rutas `me/...` van antes que
 * las de `:id` para que «me» no se lea como id.
 */
@ApiTags('niveles-juego')
@ApiBearerAuth(BEARER_AUTH)
@Controller('estudiantes')
export class NivelJuegoController {
  constructor(private readonly niveles: NivelJuegoService) {}

  @Get('me/niveles-juego')
  @Roles('ESTUDIANTE')
  @ApiOperation({
    summary: 'Mi nivel en cada juego (estudiante)',
    description:
      'Emparejar, Clasificar, Secuenciar y Memoria: nivel actual (1-5), si completó el 5 y cuántos intentos esperan validación.',
  })
  @ApiOkResponse({ type: [NivelJuegoDto] })
  @ApiErrores(401, 403)
  async misNiveles(
    @UsuarioActual() actual: UsuarioAutenticado,
  ): Promise<NivelJuegoDto[]> {
    return (await this.niveles.niveles(actual, actual.id)).map(
      NivelJuegoMapper.aDto,
    );
  }

  @Get('me/niveles-juego/:juego/actividad')
  @Roles('ESTUDIANTE')
  @ApiParam(PARAM_JUEGO)
  @ApiOperation({
    summary: 'La actividad de mi nivel actual en un juego (estudiante)',
    description:
      'Abre directamente el nivel actual (si completó el 5, el 5). Los intentos se envían a POST /intentos con su actividadId: ' +
      'solo se aceptan los del nivel actual.',
  })
  @ApiOkResponse({ type: ActividadDelNivelDto })
  @ApiErrores(401, 403, {
    404: 'El juego no tiene escalera o el nivel aún no tiene actividad',
  })
  async actividad(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('juego') juego: string,
  ): Promise<ActividadDelNivelDto> {
    return NivelJuegoMapper.aActividadDto(
      await this.niveles.actividadActual(actual, juego),
    );
  }

  @Get(':id/niveles-juego')
  @Roles('DIRECTORA', 'TALLERISTA', 'ACUDIENTE')
  @ApiOperation({
    summary: 'Nivel de un estudiante en cada juego',
    description:
      'Directora, tallerista a cargo o acudiente vinculado. Estudiante ajeno → 404.',
  })
  @ApiOkResponse({ type: [NivelJuegoDto] })
  @ApiErrores(400, 401, 403, 404)
  async deEstudiante(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
  ): Promise<NivelJuegoDto[]> {
    return (await this.niveles.niveles(actual, id)).map(NivelJuegoMapper.aDto);
  }

  @Put(':id/niveles-juego/:juego')
  @Roles('DIRECTORA', 'TALLERISTA')
  @ApiParam(PARAM_JUEGO)
  @ApiOperation({
    summary: 'Poner a mano el nivel de un juego',
    description:
      'Directora o tallerista a cargo (estudiante ajeno → 404). Motivo obligatorio; queda en el historial. ' +
      'El juego queda sin completar. No avisa al acudiente.\n\n' +
      '**Quién sube y quién baja:** la directora puede subir o bajar. La tallerista solo puede ' +
      'bajar (o repetir un juego completado en su nivel): si pide un nivel mayor que el actual → 403. ' +
      'La tallerista sube al niño aprobando un intento del nivel actual (POST /intentos/:id/validacion).',
  })
  @ApiOkResponse({ type: NivelJuegoDto })
  @ApiErrores(400, 401, {
    403: 'Rol sin acceso, o tallerista que intenta subir de nivel a mano (solo la directora sube)',
    404: 'Estudiante ajeno o juego sin escalera',
    409: 'El nivel cambió mientras tanto (vuelve a cargarlo)',
    422: 'Falta el motivo o ya va en ese nivel',
  })
  async ajustar(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Param('juego') juego: string,
    @Body() dto: AjustarNivelJuegoDto,
  ): Promise<NivelJuegoDto> {
    return NivelJuegoMapper.aDto(
      await this.niveles.ajustar(actual, id, juego, dto.nivel, dto.motivo),
    );
  }
}
