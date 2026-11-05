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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common/auth/decoradores.js';
import { aBigInt } from '../../../common/ids/ids.js';
import { ParseBigIntPipe } from '../../../common/pipes/parse-bigint.pipe.js';
import { ApiErrores } from '../../../docs/api-errores.js';
import { BEARER_AUTH } from '../../../docs/swagger.js';
import { VinculosService } from '../application/vinculos.service.js';
import { EstudianteMapper } from '../infrastructure/estudiante.mapper.js';
import {
  ActualizarAcudienteDto,
  AsignarTalleristaDto,
  VincularAcudienteDto,
} from './dto/estudiante-entrada.dto.js';
import {
  TalleristaAsignadaDto,
  VinculoAcudienteDto,
} from './dto/estudiante.dto.js';

/** Talleristas y acudientes de un estudiante. Solo la directora. */
@ApiTags('estudiantes')
@ApiBearerAuth(BEARER_AUTH)
@Roles('DIRECTORA')
@Controller('estudiantes/:id')
export class VinculosController {
  constructor(private readonly vinculos: VinculosService) {}

  // ─── Talleristas ──────────────────────────────────────────────────────────

  @Get('talleristas')
  @ApiOperation({
    summary: 'Talleristas del estudiante, actuales y anteriores (directora)',
  })
  @ApiOkResponse({ type: [TalleristaAsignadaDto] })
  @ApiErrores(400, 401, 403, 404)
  async listarTalleristas(
    @Param('id', ParseBigIntPipe) id: bigint,
  ): Promise<TalleristaAsignadaDto[]> {
    return (await this.vinculos.listarTalleristas(id)).map(
      EstudianteMapper.talleristaADto,
    );
  }

  @Post('talleristas')
  @ApiOperation({
    summary: 'Poner al estudiante a cargo de una tallerista (directora)',
    description:
      'Si ya estuvo a cargo antes, se reactiva el vínculo desde hoy.',
  })
  @ApiCreatedResponse({ type: TalleristaAsignadaDto })
  @ApiErrores(400, 401, 403, 404, {
    409: 'La tallerista ya lo tiene a cargo',
    422: 'La cuenta no es de una tallerista activa',
  })
  async asignarTallerista(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: AsignarTalleristaDto,
  ): Promise<TalleristaAsignadaDto> {
    return EstudianteMapper.talleristaADto(
      await this.vinculos.asignarTallerista(id, aBigInt(dto.talleristaId)),
    );
  }

  @Delete('talleristas/:talleristaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'La tallerista deja de tener a cargo al estudiante (directora)',
    description: 'Pierde el acceso al instante; se conserva el historial.',
  })
  @ApiNoContentResponse({ description: 'Vínculo desactivado' })
  @ApiErrores(400, 401, 403, 404)
  async retirarTallerista(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Param('talleristaId', ParseBigIntPipe) talleristaId: bigint,
  ): Promise<void> {
    await this.vinculos.retirarTallerista(id, talleristaId);
  }

  // ─── Acudientes ───────────────────────────────────────────────────────────

  @Get('acudientes')
  @ApiOperation({ summary: 'Acudientes del estudiante (directora)' })
  @ApiOkResponse({ type: [VinculoAcudienteDto] })
  @ApiErrores(400, 401, 403, 404)
  async listarAcudientes(
    @Param('id', ParseBigIntPipe) id: bigint,
  ): Promise<VinculoAcudienteDto[]> {
    return (await this.vinculos.listarAcudientes(id)).map(
      EstudianteMapper.acudienteADto,
    );
  }

  @Post('acudientes')
  @ApiOperation({ summary: 'Vincular un acudiente (directora)' })
  @ApiCreatedResponse({ type: VinculoAcudienteDto })
  @ApiErrores(400, 401, 403, 404, {
    409: 'Ya está vinculado, o el estudiante ya tiene acudiente principal',
    422: 'La cuenta no es de un acudiente activo',
  })
  async vincularAcudiente(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: VincularAcudienteDto,
  ): Promise<VinculoAcudienteDto> {
    return EstudianteMapper.acudienteADto(
      await this.vinculos.vincularAcudiente(
        id,
        aBigInt(dto.acudienteId),
        dto.parentesco,
        dto.esPrincipal ?? false,
      ),
    );
  }

  @Patch('acudientes/:acudienteId')
  @ApiOperation({
    summary: 'Cambiar parentesco o acudiente principal (directora)',
    description:
      'Marcar esPrincipal = true quita la marca al principal anterior.',
  })
  @ApiOkResponse({ type: VinculoAcudienteDto })
  @ApiErrores(400, 401, 403, 404, { 422: 'No se envió ningún cambio' })
  async actualizarAcudiente(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Param('acudienteId', ParseBigIntPipe) acudienteId: bigint,
    @Body() dto: ActualizarAcudienteDto,
  ): Promise<VinculoAcudienteDto> {
    return EstudianteMapper.acudienteADto(
      await this.vinculos.actualizarAcudiente(id, acudienteId, {
        parentesco: dto.parentesco ?? null,
        esPrincipal: dto.esPrincipal ?? null,
      }),
    );
  }

  @Delete('acudientes/:acudienteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desvincular un acudiente (directora)' })
  @ApiNoContentResponse({ description: 'Vínculo eliminado' })
  @ApiErrores(400, 401, 403, 404)
  async desvincularAcudiente(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Param('acudienteId', ParseBigIntPipe) acudienteId: bigint,
  ): Promise<void> {
    await this.vinculos.desvincularAcudiente(id, acudienteId);
  }
}
