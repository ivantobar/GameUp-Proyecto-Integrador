import type { Cuenta } from './cuenta.entity.js';

/** Puerto de lectura de cuentas para la autenticación. */
export interface CuentaRepository {
  buscarPorIdUsuarioAuth(idUsuarioAuth: bigint): Promise<Cuenta | null>;
}

export const CUENTA_REPOSITORY = Symbol('CUENTA_REPOSITORY');
