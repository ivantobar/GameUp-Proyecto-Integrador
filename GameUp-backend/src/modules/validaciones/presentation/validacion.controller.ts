import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
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
import { IntentoMapper } from '../../intentos/infrastructure/intento.mapper.js';
import { NivelJuegoMapper } from '../../niveles-juego/infrastructure/nivel-juego.mapper.js';
import { UrlFirmadaDto } from '../../modulos/presentation/dto/modulo.dto.js';
import { GrabacionService } from '../application/grabacion.service.js';
import { ValidacionService } from '../application/validacion.service.js';
import { RevisionMapper } from '../infrastructure/revision.mapper.js';
import {
  AprobarLoteDto,
  IntentoValidadoDto,
  LoteAprobadoDto,
  PaginaRevisionDto,
  PendientesQueryDto,
  ResumenPendientesDto,
  ValidarIntentoDto,
} from './dto/validacion.dto.js';

/** Revisión de la tallerista (solo sus estudiantes) o la directora. */
@ApiTags('validacion')
@ApiBearerAuth(BEARER_AUTH)
@Roles('DIRECTORA', 'TALLERISTA')
@Controller()
export class ValidacionController {
  constructor(
    private readonly validaciones: ValidacionService,
    private readonly grabaciones: GrabacionService,
  ) {}

  // Antes de cualquier ruta con parámetro: «resumen» no es un id.
  @Get('revisiones/pendientes/resumen')
  @ApiOperation({
    summary: 'Lista de «Por escuchar»: pendientes por estudiante',
    description:
      'Por cada estudiante con intentos sin validar: cuántos tiene y la fecha del más antiguo. ' +
      'Cuenta los mismos intentos que GET /revisiones/pendientes y con el mismo alcance ' +
      '(la tallerista, sus estudiantes activos; la directora, todos). ' +
      'Del que más tiempo lleva esperando al que menos; los que no tienen pendientes no salen.',
  })
  @ApiOkResponse({ type: [ResumenPendientesDto] })
  @ApiErrores(401, 403)
  async resumenPendientes(
    @UsuarioActual() actual: UsuarioAutenticado,
  ): Promise<ResumenPendientesDto[]> {
    const resumen = await this.validaciones.resumenPendientes(actual);
    return resumen.map(RevisionMapper.aResumenDto);
  }

  @Get('revisiones/pendientes')
  @ApiOperation({
    summary: 'Bandeja «Por escuchar»',
    description:
      'Intentos sin validar de mis estudiantes (la directora: de todos), del más antiguo al más reciente.',
  })
  @ApiOkResponse({ type: PaginaRevisionDto })
  @ApiErrores(400, 401, 403)
  async pendientes(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Query() q: PendientesQueryDto,
  ): Promise<PaginaRevisionDto> {
    const pagina = await this.validaciones.pendientes(
      actual,
      q.estudianteId ? aBigInt(q.estudianteId) : null,
      { page: q.page, limit: q.limit },
    );
    return mapearPagina(pagina, RevisionMapper.aDto);
  }

  @Get('intentos/:id/grabacion')
  @ApiOperation({
    summary: 'URL firmada del audio de un intento (10 min)',
    description:
      'Solo la tallerista a cargo o la directora. 404 si no hay audio, venció o ya se validó.',
  })
  @ApiOkResponse({ type: UrlFirmadaDto })
  @ApiErrores(400, 401, 403, 404, 503)
  async grabacion(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
  ): Promise<UrlFirmadaDto> {
    const url = await this.grabaciones.urlAudio(actual, id);
    return { url: url.url, expiraEn: url.expiraEn.toISOString() };
  }

  @Post('intentos/:id/validacion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar un intento: «Lo logró» o «Practicar más»',
    description:
      'RECHAZADO exige retroalimentación. Si el intento de voz tiene audio disponible, ' +
      'quien valida debe haber pedido antes su URL firmada (GET /intentos/:id/grabacion). ' +
      'Solo cuentan para el progreso los APROBADOS. ' +
      'Si es de la escalera y de su nivel actual, APROBADO sube un nivel (subidaNivel). ' +
      'Después se borra el audio del intento (en ambos casos).',
  })
  @ApiOkResponse({ type: IntentoValidadoDto })
  @ApiErrores(400, 401, 403, 404, {
    409: 'El intento ya fue validado',
    422: 'Falta la retroalimentación para RECHAZADO, o no se escuchó el audio disponible',
  })
  async validar(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: ValidarIntentoDto,
  ): Promise<IntentoValidadoDto> {
    const { intento, subida } = await this.validaciones.validar(
      actual,
      id,
      dto.resultado,
      dto.retroalimentacion ?? null,
    );
    return {
      ...IntentoMapper.aDto(intento),
      subidaNivel: subida ? NivelJuegoMapper.aSubidaDto(subida) : null,
    };
  }

  @Post('validaciones/lote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aprobar varios intentos de juegos sin voz a la vez',
    description:
      'Todos o ninguno. Los de Habla conmigo se validan uno por uno, escuchando el audio. ' +
      'En la escalera, cada nivel sube una sola vez y nunca se salta (subidas).',
  })
  @ApiOkResponse({ type: LoteAprobadoDto })
  @ApiErrores(400, 401, 403, {
    422: 'Algún intento no existe, ya fue validado o es de voz (no se aprueba ninguno)',
  })
  async aprobarLote(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Body() dto: AprobarLoteDto,
  ): Promise<LoteAprobadoDto> {
    const { aprobados, subidas } = await this.validaciones.aprobarLote(
      actual,
      dto.intentoIds.map(aBigInt),
    );
    return { aprobados, subidas: subidas.map(NivelJuegoMapper.aSubidaDto) };
  }
}
