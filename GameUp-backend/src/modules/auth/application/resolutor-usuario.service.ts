import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ResolutorUsuario } from '../../../common/auth/resolutor-usuario.js';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import type { IdentidadExterna } from '../../../common/auth/verificador-token.js';
import { AccesoDenegadoError } from '../../../common/errors/dominio.errors.js';
import {
  CUENTA_REPOSITORY,
  type CuentaRepository,
} from '../domain/cuenta.repository.js';
import { MapeadorRoles } from '../domain/mapeador-roles.js';

/**
 * Caso de uso: de la identidad externa a la cuenta de GameUP.
 *
 * Reglas (decididas en la fase 0):
 *  - Si ningún rol externo tiene acceso (DONANTE, desconocido) → 403.
 *  - Si no hay fila en `usuario` con ese id_usuario_auth → 403 (la directora la da de alta).
 *  - Si la cuenta está inactiva → 403.
 *  - Si es un estudiante EGRESADO o RETIRADO → 403 (su historial se conserva).
 *  - Se queda con el rol externo que coincide con el rol local. Si ninguno
 *    coincide → 403, y el rol local NO se cambia (lo revisa la directora).
 */
@Injectable()
export class ResolutorUsuarioService implements ResolutorUsuario {
  private readonly logger = new Logger(ResolutorUsuarioService.name);

  constructor(
    @Inject(CUENTA_REPOSITORY) private readonly cuentas: CuentaRepository,
  ) {}

  async resolver(identidad: IdentidadExterna): Promise<UsuarioAutenticado> {
    const rolesExternos = MapeadorRoles.aRolesGameUp(identidad.roles);
    if (rolesExternos.length === 0) {
      throw new AccesoDenegadoError('Tu cuenta no tiene acceso a GameUP.');
    }

    const cuenta = await this.cuentas.buscarPorIdUsuarioAuth(
      identidad.idUsuarioAuth,
    );
    if (!cuenta) {
      throw new AccesoDenegadoError(
        'Tu cuenta aún no está registrada en GameUP. Pide a la directora de la fundación que te dé de alta.',
      );
    }
    if (!cuenta.activo) {
      throw new AccesoDenegadoError(
        'Tu cuenta de GameUP está desactivada. Habla con la directora de la fundación.',
      );
    }
    if (cuenta.esEstudianteSinAcceso()) {
      throw new AccesoDenegadoError(
        'Tu cuenta de estudiante ya no está activa en GameUP. Habla con la fundación.',
      );
    }
    if (!cuenta.coincideCon(rolesExternos)) {
      // Solo ids internos en el log: nada de nombres ni tokens.
      this.logger.warn(
        `Rol externo no coincide con el rol local (usuario ${cuenta.id})`,
      );
      throw new AccesoDenegadoError(
        'Tu rol en la cuenta de la fundación no coincide con tu rol en GameUP. Pide a la directora que lo revise.',
      );
    }

    return {
      id: cuenta.id,
      idUsuarioAuth: cuenta.idUsuarioAuth,
      rol: cuenta.rol,
    };
  }
}
