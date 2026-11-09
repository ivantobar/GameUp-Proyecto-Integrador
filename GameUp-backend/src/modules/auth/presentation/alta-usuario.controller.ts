import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles, TokenActual } from '../../../common/auth/decoradores.js';
import { aBigInt } from '../../../common/ids/ids.js';
import { ApiErrores } from '../../../docs/api-errores.js';
import { BEARER_AUTH } from '../../../docs/swagger.js';
import { UsuarioMapper } from '../../usuarios/infrastructure/usuario.mapper.js';
import { CrearUsuarioDto } from '../../usuarios/presentation/dto/crear-usuario.dto.js';
import { UsuarioDto } from '../../usuarios/presentation/dto/usuario.dto.js';
import { AltaDirectoraService } from '../application/alta-directora.service.js';

/**
 * POST /usuarios (la directora da de alta una cuenta). Vive en AuthModule
 * porque, como el alta automática, consulta la API central y ASISCO UP; las
 * demás rutas de /usuarios siguen en UsuariosModule.
 */
@ApiTags('usuarios')
@ApiBearerAuth(BEARER_AUTH)
@Roles('DIRECTORA')
@Controller('usuarios')
export class AltaUsuarioController {
  constructor(private readonly alta: AltaDirectoraService) {}

  @Post()
  @ApiOperation({
    summary: 'Dar de alta una cuenta (directora)',
    description:
      'Crea la copia mínima de una persona que **ya existe en la API central** ' +
      '(GameUP nunca crea credenciales ni llama a /api/auth/registro). El Bearer es el ' +
      'JWT de la API central de la directora.\n\n' +
      '**Ids:** `idUsuarioAuth` es el `id_usuario` de la API central; ' +
      '`idEstudianteExterno` es el `idEstudiante` local de ASISCO UP (Método Consuelo); ' +
      'el `id` de la respuesta es el id interno de GameUP.\n\n' +
      '1. Consulta **GET /api/usuarios/{idUsuarioAuth}** de la API central con el token ' +
      'de la directora y toma de ahí nombres, apellidos, correo y roles. **Si llegan ' +
      '`nombres`, `apellidos` o `correo` en el cuerpo, se ignoran:** siempre se usan los ' +
      'de la API central.\n' +
      '2. El `rol` pedido debe estar entre sus roles centrales (ADMIN equivale a DIRECTORA).\n' +
      '3. ESTUDIANTE: su `idEstudianteExterno` sale de **GET /api/estudiantes/por-usuario/' +
      '{idUsuarioAuth}** de ASISCO UP; si la directora lo manda, debe coincidir. Se crea ' +
      'también su fila en estudiante (nivel inicial BAJO si no se indica).\n\n' +
      '**Ya no es obligatorio:** con `ALTA_AUTOMATICA_ROLES`, la cuenta se crea sola en el ' +
      'primer inicio de sesión (POST /auth/login). Esta ruta queda para casos especiales: ' +
      'personas con varios roles en la fundación, un nivel inicial distinto, un ' +
      '`idAcudienteExterno`, o un rol con el alta automática apagada.',
  })
  @ApiCreatedResponse({ type: UsuarioDto })
  @ApiErrores(400, 401, 403, {
    409: 'Ya existe una cuenta con ese idUsuarioAuth o idEstudianteExterno',
    422:
      'La persona no existe en la API central; el rol pedido no está entre sus roles ' +
      'centrales; el estudiante no está en ASISCO UP o su idEstudianteExterno no ' +
      'coincide; o los datos no cumplen las reglas del rol',
    503: 'La API central o ASISCO UP no responden',
  })
  async crear(
    @Body() dto: CrearUsuarioDto,
    @TokenActual() token: string,
  ): Promise<UsuarioDto> {
    const usuario = await this.alta.crear(
      {
        idUsuarioAuth: aBigInt(dto.idUsuarioAuth),
        rol: dto.rol,
        idAcudienteExterno: dto.idAcudienteExterno
          ? aBigInt(dto.idAcudienteExterno)
          : null,
        idEstudianteExterno: dto.idEstudianteExterno
          ? aBigInt(dto.idEstudianteExterno)
          : null,
        nivelId: dto.nivelId ? aBigInt(dto.nivelId) : null,
      },
      token,
    );
    return UsuarioMapper.aDto(usuario);
  }
}
