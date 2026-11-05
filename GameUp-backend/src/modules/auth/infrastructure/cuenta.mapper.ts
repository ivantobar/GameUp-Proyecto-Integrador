import { esRolGameUp } from '../../../common/auth/usuario-autenticado.js';
import { Cuenta } from '../domain/cuenta.entity.js';

/** Columnas que se leen de `usuario` para armar una Cuenta. */
export interface FilaCuenta {
  id: bigint;
  id_usuario_auth: bigint;
  activo: boolean;
  rol: { nombre: string };
  estudiante: { estado: string } | null;
}

export const CuentaMapper = {
  aEntidad(fila: FilaCuenta): Cuenta {
    // La base lo garantiza con ck_rol_nombre; si falla, es un error de datos.
    if (!esRolGameUp(fila.rol.nombre)) {
      throw new Error('Rol desconocido en la tabla rol');
    }
    return new Cuenta(
      fila.id,
      fila.id_usuario_auth,
      fila.rol.nombre,
      fila.activo,
      fila.estudiante?.estado ?? null,
    );
  },
} as const;
