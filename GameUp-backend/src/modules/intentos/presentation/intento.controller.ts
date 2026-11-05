import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { ArchivoSubido } from '../../../common/almacenamiento/almacen-archivos.js';
import { SubidaDeArchivo } from '../../../common/almacenamiento/subidas.js';
import { Roles, UsuarioActual } from '../../../common/auth/decoradores.js';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import { aBigInt } from '../../../common/ids/ids.js';
import { ParseBigIntPipe } from '../../../common/pipes/parse-bigint.pipe.js';
import { ApiErrores } from '../../../docs/api-errores.js';
import { BEARER_AUTH } from '../../../docs/swagger.js';
import { HablaConmigoService } from '../application/habla-conmigo.service.js';
import { IntentoService } from '../application/intento.service.js';
import { PracticaService } from '../application/practica.service.js';
import { IntentoMapper } from '../infrastructure/intento.mapper.js';
import {
  IntentoDto,
  IntentoVozDto,
  PracticaVocalDto,
  PuntoRetornoDto,
  RegistrarIntentoDto,
  RegistrarIntentoVozDto,
} from './dto/intento.dto.js';

/** Igual que el límite del bucket `grabaciones`. */
export const TAMANO_MAXIMO_AUDIO = 10 * 1024 * 1024;

@ApiTags('intentos')
@ApiBearerAuth(BEARER_AUTH)
@Controller('intentos')
export class IntentoController {
  constructor(
    private readonly intentos: IntentoService,
    private readonly habla: HablaConmigoService,
  ) {}

  @Post()
  @Roles('ESTUDIANTE')
  @ApiOperation({
    summary: 'Registrar un intento de un juego sin voz (estudiante)',
    description:
      'Queda pendiente de validación de la tallerista: nada se aprueba solo. ' +
      'El número de intento lo pone la base.',
  })
  @ApiCreatedResponse({ type: IntentoDto })
  @ApiErrores(400, 401, 403, {
    404: 'La actividad no existe, está inactiva o su módulo no está asignado',
    422: 'Resultado inválido, o el módulo ya está completado',
  })
  async registrar(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Body() dto: RegistrarIntentoDto,
  ): Promise<IntentoDto> {
    return IntentoMapper.aDto(
      await this.intentos.registrar(
        actual,
        aBigInt(dto.actividadId),
        dto.resultado,
      ),
    );
  }

  @Post('habla-conmigo')
  @Roles('ESTUDIANTE')
  // A disco temporal (nunca en memoria); el temporal se borra siempre.
  @SubidaDeArchivo('audio', TAMANO_MAXIMO_AUDIO)
  @ApiOperation({
    summary:
      'Registrar un intento de Habla conmigo, con o sin voz (estudiante)',
    description:
      'El audio solo se guarda si hay consentimiento vigente verificado; si no, el intento ' +
      'se guarda sin audio. La app no califica la pronunciación: queda pendiente de la tallerista.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['actividadId'],
      properties: {
        actividadId: { type: 'string', example: '8' },
        duracionSeg: { type: 'integer', example: 4 },
        audio: {
          type: 'string',
          format: 'binary',
          description: 'M4A/MP4, AAC o WebM; máximo 10 MB',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: IntentoVozDto })
  @ApiPayloadTooLargeResponse({ description: 'El audio pasa de 10 MB' })
  @ApiErrores(400, 401, 403, {
    404: 'La actividad no existe, está inactiva o su módulo no está asignado',
    422: 'Audio inválido, actividad que no es de Habla conmigo, o módulo completado',
  })
  async registrarVoz(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Body() dto: RegistrarIntentoVozDto,
    @UploadedFile() audio: ArchivoSubido | undefined,
  ): Promise<IntentoVozDto> {
    const resultado = await this.habla.registrar(
      actual,
      aBigInt(dto.actividadId),
      dto.duracionSeg ?? null,
      audio ?? null,
    );
    return IntentoMapper.aVozDto(resultado);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Ver un intento',
    description:
      'El estudiante, su tallerista a cargo, su acudiente o la directora. No incluye el audio.',
  })
  @ApiOkResponse({ type: IntentoDto })
  @ApiErrores(400, 401, 403, 404)
  async obtener(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
  ): Promise<IntentoDto> {
    return IntentoMapper.aDto(await this.intentos.obtener(actual, id));
  }
}

/** Práctica de vocales del estudiante con sesión (no es el progreso oficial). */
@ApiTags('intentos')
@ApiBearerAuth(BEARER_AUTH)
@Roles('ESTUDIANTE')
@Controller('estudiantes/me')
export class PracticaController {
  constructor(private readonly practica: PracticaService) {}

  @Get('practica-vocales')
  @ApiOperation({ summary: 'Estrellas de práctica por vocal (0-3)' })
  @ApiOkResponse({ type: [PracticaVocalDto] })
  @ApiErrores(401, 403)
  async vocales(
    @UsuarioActual() actual: UsuarioAutenticado,
  ): Promise<PracticaVocalDto[]> {
    return this.practica.vocales(actual);
  }

  @Get('punto-retorno')
  @ApiOperation({ summary: '«Sigue donde ibas»: la última vocal practicada' })
  @ApiOkResponse({ type: PuntoRetornoDto })
  @ApiErrores(401, 403)
  async puntoRetorno(
    @UsuarioActual() actual: UsuarioAutenticado,
  ): Promise<PuntoRetornoDto> {
    const vocal = await this.practica.puntoRetorno(actual);
    return {
      puntoRetorno: vocal ? { tipoJuego: 'HABLA_CONMIGO', vocal } : null,
    };
  }
}
