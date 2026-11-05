import type { Cuenta } from '../../src/modules/auth/domain/cuenta.entity.js';
import type { CuentaRepository } from '../../src/modules/auth/domain/cuenta.repository.js';

/** Implementación en memoria del puerto CuentaRepository (pruebas). */
export class CuentaRepositoryEnMemoria implements CuentaRepository {
  private readonly cuentas = new Map<bigint, Cuenta>();

  constructor(cuentas: Cuenta[] = []) {
    for (const cuenta of cuentas) this.agregar(cuenta);
  }

  agregar(cuenta: Cuenta): void {
    this.cuentas.set(cuenta.idUsuarioAuth, cuenta);
  }

  async buscarPorIdUsuarioAuth(idUsuarioAuth: bigint): Promise<Cuenta | null> {
    return this.cuentas.get(idUsuarioAuth) ?? null;
  }
}
