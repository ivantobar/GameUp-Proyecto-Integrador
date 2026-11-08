import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Public,
  TokenActual,
  UsuarioActual,
} from '../../../common/auth/decoradores.js';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import { ApiErrores } from '../../../docs/api-errores.js';
import { BEARER_AUTH } from '../../../docs/swagger.js';
import { AuthService } from '../application/auth.service.js';
import { SesionMapper } from '../infrastructure/sesion.mapper.js';
import {
  LoginDto,
  LoginRespuestaDto,
  SesionUsuarioDto,
} from './dto/sesion.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Reenvía las credenciales a la API de seguridad y devuelve su token con la ' +
      'sesión de la app.\n\n' +
      '**Alta automática en el primer inicio de sesión:** si la persona aún no tiene ' +
      'cuenta en GameUP y su rol de seguridad da acceso (ADMIN→DIRECTORA, TALLERISTA, ' +
      'ACUDIENTE, ESTUDIANTE) y está en `ALTA_AUTOMATICA_ROLES`, se crea su cuenta y ' +
      'entra. El ESTUDIANTE además debe existir en ASISCO UP con su `id_usuario` de ' +
      'seguridad (de ahí sale su `idEstudianteExterno`). Una cuenta que ya existe ' +
      'nunca se reactiva ni cambia de rol. Solo pasa aquí: las demás rutas nunca crean cuentas.',
  })
  @ApiOkResponse({ type: LoginRespuestaDto })
  @ApiErrores(400, {
    401: 'Correo o contraseña incorrectos',
    403:
      'Rol sin acceso (ej.: DONANTE); cuenta inactiva, estudiante egresado o retirado; ' +
      'rol de seguridad distinto al de GameUP; varios roles con acceso (la directora da ' +
      'el alta con POST /usuarios); estudiante que ASISCO UP no encuentra; datos que ya ' +
      'usa otra cuenta; o alta automática apagada para ese rol. El `message` dice cuál.',
    503:
      'La API de seguridad no responde o no está configurada, o ASISCO UP no responde ' +
      'durante el alta de un estudiante («Espera un momento e inténtalo otra vez»)',
  })
  async login(@Body() dto: LoginDto): Promise<LoginRespuestaDto> {
    const sesion = await this.auth.iniciarSesion(dto.correo, dto.contrasena);
    return SesionMapper.aLoginDto(sesion);
  }

  @Get('me')
  @ApiBearerAuth(BEARER_AUTH)
  @ApiOperation({ summary: 'Sesión de quien hace la petición' })
  @ApiOkResponse({ type: SesionUsuarioDto })
  @ApiErrores(401, 403, 503)
  async me(
    @UsuarioActual() actual: UsuarioAutenticado,
  ): Promise<SesionUsuarioDto> {
    return SesionMapper.aSesionDto(await this.auth.sesionActual(actual));
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth(BEARER_AUTH)
  @ApiOperation({
    summary: 'Cerrar sesión',
    description:
      'GameUP olvida el token de su caché. El token lo emite la API de seguridad: ' +
      'la app debe descartarlo. Si esa API lo revoca, la siguiente petición recibe 401 de inmediato.',
  })
  @ApiNoContentResponse({ description: 'Sesión cerrada' })
  @ApiErrores(401, 403, 503)
  logout(@TokenActual() token: string): void {
    this.auth.cerrarSesion(token);
  }
}
