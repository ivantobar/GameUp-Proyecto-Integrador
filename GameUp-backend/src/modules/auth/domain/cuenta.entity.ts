import type { RolGameUp } from '../../../common/auth/usuario-autenticado.js';

/**
 * Cuenta: lo mínimo que GameUP sabe de quien inicia sesión (tabla usuario).
 * Los datos personales oficiales viven en la API de seguridad.
 */
export class Cuenta {
  constructor(
    readonly id: bigint,
    readonly idUsuarioAuth: bigint,
    readonly rol: RolGameUp,
    readonly activo: boolean,
  ) {}

  /** ¿Alguno de los roles externos coincide con el rol de esta cuenta? */
  coincideCon(rolesExternos: readonly RolGameUp[]): boolean {
    return rolesExternos.includes(this.rol);
  }
}
