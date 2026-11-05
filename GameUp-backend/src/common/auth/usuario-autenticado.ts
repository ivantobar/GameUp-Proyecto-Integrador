/** Roles de GameUP (tabla `rol`). Son los que usan @Roles() y los servicios. */
export const ROLES_GAMEUP = [
  'DIRECTORA',
  'TALLERISTA',
  'ACUDIENTE',
  'ESTUDIANTE',
] as const;

export type RolGameUp = (typeof ROLES_GAMEUP)[number];

export function esRolGameUp(valor: string): valor is RolGameUp {
  return (ROLES_GAMEUP as readonly string[]).includes(valor);
}

/**
 * Quién hace la petición, ya verificado: token válido en la API de seguridad
 * y cuenta activa en GameUP con un rol que coincide.
 * Se obtiene en los controladores con @UsuarioActual().
 */
export interface UsuarioAutenticado {
  /** usuario.id (id interno de GameUP). */
  id: bigint;
  /** usuario.id_usuario_auth (id_usuario de la API de seguridad). */
  idUsuarioAuth: bigint;
  rol: RolGameUp;
}
