import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AccesoDenegadoError,
  NoAutenticadoError,
} from '../errors/dominio.errors.js';
import { ES_PUBLICA, ROLES_PERMITIDOS } from './decoradores.js';
import type { SolicitudAutenticada } from './solicitud.js';
import type { RolGameUp } from './usuario-autenticado.js';

/**
 * Guard global de roles (se ejecuta después de AuthGuard). Si la ruta tiene
 * @Roles(...), el rol del usuario debe estar en la lista; si no, 403.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const objetivos = [ctx.getHandler(), ctx.getClass()];
    if (
      this.reflector.getAllAndOverride<boolean | undefined>(
        ES_PUBLICA,
        objetivos,
      )
    ) {
      return true;
    }

    const roles = this.reflector.getAllAndOverride<RolGameUp[] | undefined>(
      ROLES_PERMITIDOS,
      objetivos,
    );
    if (!roles || roles.length === 0) return true;

    const usuario = ctx
      .switchToHttp()
      .getRequest<SolicitudAutenticada>().usuario;
    if (!usuario) throw new NoAutenticadoError();
    if (!roles.includes(usuario.rol)) {
      throw new AccesoDenegadoError('Tu rol no tiene acceso a esta acción.');
    }
    return true;
  }
}
