import { NoAutenticadoError } from '../../src/common/errors/dominio.errors.js';
import type { AutenticadorExterno } from '../../src/modules/auth/domain/autenticador-externo.js';
import { MENSAJE_CREDENCIALES } from '../../src/modules/auth/infrastructure/autenticador-seguridad-http.js';

/** Simula el login de la API de seguridad: correo → { contraseña, token }. */
export class AutenticadorFalso implements AutenticadorExterno {
  constructor(
    private readonly cuentas: Record<
      string,
      { contrasena: string; token: string }
    >,
  ) {}

  async iniciarSesion(correo: string, contrasena: string): Promise<string> {
    const cuenta = this.cuentas[correo];
    if (!cuenta || cuenta.contrasena !== contrasena) {
      throw new NoAutenticadoError(MENSAJE_CREDENCIALES);
    }
    return cuenta.token;
  }
}
