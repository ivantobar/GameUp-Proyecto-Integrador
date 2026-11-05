import { Controller, Get, Param, Put } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles, UsuarioActual } from '../../../common/auth/decoradores.js';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import { ParseBigIntPipe } from '../../../common/pipes/parse-bigint.pipe.js';
import { ApiErrores } from '../../../docs/api-errores.js';
import { BEARER_AUTH } from '../../../docs/swagger.js';
import { PracticaCasaService } from '../application/practica-casa.service.js';
import { PracticaCasaMapper } from '../infrastructure/practica-casa.mapper.js';
import { PracticaSemanalDto } from './dto/practica-casa.dto.js';

/**
 * «Practicar en casa»: solo el acudiente la marca, con sus propios
 * estudiantes; la leen también la tallerista a cargo y la directora.
 */
@ApiTags('practica-casa')
@ApiBearerAuth(BEARER_AUTH)
@Controller('estudiantes')
export class PracticaCasaController {
  constructor(private readonly practica: PracticaCasaService) {}

  @Get(':id/practica-semanal')
  @Roles('DIRECTORA', 'TALLERISTA', 'ACUDIENTE')
  @ApiOperation({
    summary: 'Días practicados en casa esta semana',
    description:
      'Lunes a domingo en hora de Bogotá. Acudiente (propio), tallerista a cargo o directora. Estudiante ajeno → 404.',
  })
  @ApiOkResponse({ type: PracticaSemanalDto })
  @ApiErrores(400, 401, 403, 404)
  async semana(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
  ): Promise<PracticaSemanalDto> {
    return PracticaCasaMapper.aDto(await this.practica.semana(actual, id));
  }

  @Put(':id/practica-casa/hoy')
  @Roles('ACUDIENTE')
  @ApiOperation({
    summary: '«Lo practicamos hoy»',
    description:
      'Solo el acudiente, con sus propios estudiantes. Marca el día de hoy (hora de Bogotá). ' +
      'Idempotente: marcar dos veces no duplica. Devuelve la semana.',
  })
  @ApiOkResponse({ type: PracticaSemanalDto })
  @ApiErrores(400, 401, 403, 404, {
    422: 'El estudiante no está activo (egresado o retirado)',
  })
  async marcarHoy(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
  ): Promise<PracticaSemanalDto> {
    return PracticaCasaMapper.aDto(await this.practica.marcarHoy(actual, id));
  }
}
