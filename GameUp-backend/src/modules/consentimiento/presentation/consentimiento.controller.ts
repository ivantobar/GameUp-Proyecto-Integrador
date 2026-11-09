import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import {
  Roles,
  TokenActual,
  UsuarioActual,
} from '../../../common/auth/decoradores.js';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import { ParseBigIntPipe } from '../../../common/pipes/parse-bigint.pipe.js';
import { ApiErrores } from '../../../docs/api-errores.js';
import { BEARER_AUTH } from '../../../docs/swagger.js';
import { ConsentimientoService } from '../application/consentimiento.service.js';
import type {
  MotivoConsentimiento,
  VerificacionConsentimiento,
} from '../domain/consulta-consentimiento.js';

const MOTIVOS: MotivoConsentimiento[] = [
  'ACEPTADO',
  'NO_ACEPTADO',
  'NO_VERIFICABLE',
];

export class ConsentimientoVozDto {
  @ApiProperty({
    example: false,
    description:
      'true solo si se verificó y está aceptado. Si es false, la app no graba.',
  })
  concedido: boolean;

  @ApiProperty({ enum: MOTIVOS, example: 'NO_VERIFICABLE' })
  motivo: MotivoConsentimiento;

  @ApiProperty({ example: '2026-11-05T15:00:00.000Z' })
  verificadoEn: string;
}

function aDto(v: VerificacionConsentimiento): ConsentimientoVozDto {
  return {
    concedido: v.concedido,
    motivo: v.motivo,
    verificadoEn: v.verificadoEn.toISOString(),
  };
}

const DESCRIPCION_FUENTE =
  'Consulta **GET /api/estudiantes/por-usuario/{idUsuarioAuth}/consentimiento** de ' +
  'ASISCO UP (Método Consuelo) con el `id_usuario` central del estudiante ' +
  '(`idUsuarioAuth`), no con su `idEstudiante` local de ASISCO UP. Se reenvía el ' +
  'Bearer de quien llama (el JWT de la API central). La respuesta solo se usa si su ' +
  '`id_usuario` y su `idEstudiante` son los del estudiante en GameUP.\n\n' +
  'Se puede grabar solo si `tieneConsentimientoVigente`, `autorizaGrabacionVoz === true` ' +
  'y `requiereAceptarTerminos !== true`. Sin consentimiento (404 en ASISCO UP): ' +
  'NO_ACEPTADO. Si ASISCO UP no responde o la respuesta no cuadra: concedido = false ' +
  '(NO_VERIFICABLE) y no se guarda audio.';

/** Consentimiento de grabación de voz (lo consulta la API del núcleo familiar). */
@ApiTags('estudiantes')
@ApiBearerAuth(BEARER_AUTH)
@Controller('estudiantes')
export class ConsentimientoController {
  constructor(private readonly consentimiento: ConsentimientoService) {}

  @Get('me/consentimiento-voz')
  @Roles('ESTUDIANTE')
  @ApiOperation({
    summary: '¿Se puede grabar mi voz? (estudiante con sesión)',
    description: DESCRIPCION_FUENTE,
  })
  @ApiOkResponse({ type: ConsentimientoVozDto })
  @ApiErrores(401, 403)
  async propio(
    @UsuarioActual() actual: UsuarioAutenticado,
    @TokenActual() token: string,
  ): Promise<ConsentimientoVozDto> {
    return aDto(
      await this.consentimiento.consultarVoz(actual, actual.id, token),
    );
  }

  @Get(':id/consentimiento-voz')
  @Roles('DIRECTORA', 'TALLERISTA', 'ACUDIENTE')
  @ApiOperation({
    summary: '¿Se puede grabar la voz de este estudiante?',
    description:
      '`{id}` es el id interno de GameUP del estudiante (`userId`).\n\n' +
      DESCRIPCION_FUENTE,
  })
  @ApiOkResponse({ type: ConsentimientoVozDto })
  @ApiErrores(400, 401, 403, 404)
  async deEstudiante(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param('id', ParseBigIntPipe) id: bigint,
    @TokenActual() token: string,
  ): Promise<ConsentimientoVozDto> {
    return aDto(await this.consentimiento.consultarVoz(actual, id, token));
  }
}
