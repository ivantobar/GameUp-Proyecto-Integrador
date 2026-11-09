import {
  Inject,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NoAutenticadoError } from '../errors/dominio.errors.js';
import { ES_PUBLICA } from './decoradores.js';
import {
  RESOLUTOR_USUARIO,
  type ResolutorUsuario,
} from './resolutor-usuario.js';
import { extraerTokenBearer, type SolicitudAutenticada } from './solicitud.js';
import {
  VERIFICADOR_TOKEN,
  type VerificadorToken,
} from './verificador-token.js';

/**
 * Guard global de autenticación. Toda ruta exige
 * "Authorization: Bearer <token>" salvo las marcadas con @Public().
 *
 * 1. Verifica el token con la API de seguridad (puerto VerificadorToken).
 * 2. Busca la cuenta en GameUP y comprueba el rol (puerto ResolutorUsuario).
 * 3. Deja el resultado en `request.usuario` (@UsuarioActual()) y la
 *    identidad central en `request.identidad` (@IdentidadActual()).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(VERIFICADOR_TOKEN) private readonly verificador: VerificadorToken,
    @Inject(RESOLUTOR_USUARIO) private readonly resolutor: ResolutorUsuario,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const esPublica = this.reflector.getAllAndOverride<boolean | undefined>(
      ES_PUBLICA,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (esPublica) return true;

    const solicitud = ctx.switchToHttp().getRequest<SolicitudAutenticada>();
    const token = extraerTokenBearer(solicitud.headers.authorization);
    if (!token) {
      throw new NoAutenticadoError(
        'Debes iniciar sesión (falta el encabezado Authorization: Bearer <token>).',
      );
    }

    const identidad = await this.verificador.verificar(token);
    solicitud.usuario = await this.resolutor.resolver(identidad);
    solicitud.identidad = identidad;
    return true;
  }
}
