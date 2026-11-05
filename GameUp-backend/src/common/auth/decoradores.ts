import {
  createParamDecorator,
  SetMetadata,
  type ExecutionContext,
} from '@nestjs/common';
import { NoAutenticadoError } from '../errors/dominio.errors.js';
import type { SolicitudAutenticada } from './solicitud.js';
import type { RolGameUp, UsuarioAutenticado } from './usuario-autenticado.js';

export const ES_PUBLICA = 'gameup:es-publica';
export const ROLES_PERMITIDOS = 'gameup:roles';

/** La ruta no exige token (solo `health` y `auth/login`). */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(ES_PUBLICA, true);

/**
 * Primer nivel de autorización: qué roles pueden usar la ruta. El segundo
 * nivel (relación con el estudiante) lo verifica siempre el servicio.
 * Sin @Roles(), cualquier usuario autenticado puede usarla.
 */
export const Roles = (
  ...roles: RolGameUp[]
): MethodDecorator & ClassDecorator => SetMetadata(ROLES_PERMITIDOS, roles);

/** Inyecta el usuario autenticado en el parámetro del controlador. */
export const UsuarioActual = createParamDecorator(
  (_dato: unknown, ctx: ExecutionContext): UsuarioAutenticado => {
    const usuario = ctx
      .switchToHttp()
      .getRequest<SolicitudAutenticada>().usuario;
    // Solo pasa si se usa en una ruta @Public(): es un error de programación.
    if (!usuario) throw new NoAutenticadoError();
    return usuario;
  },
);
