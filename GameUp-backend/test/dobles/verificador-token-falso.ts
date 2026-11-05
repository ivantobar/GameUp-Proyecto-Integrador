import type {
  IdentidadExterna,
  VerificadorToken,
} from '../../src/common/auth/verificador-token.js';
import { NoAutenticadoError } from '../../src/common/errors/dominio.errors.js';

/** Identidad ficticia (sin datos reales). */
export function identidad(
  idUsuarioAuth: number,
  roles: string[],
): IdentidadExterna {
  return {
    idUsuarioAuth: BigInt(idUsuarioAuth),
    roles,
    nombres: 'Persona',
    apellidos: 'De Prueba',
    correo: null,
  };
}

/** Simula la API de seguridad: cada token conocido da una identidad. */
export class VerificadorTokenFalso implements VerificadorToken {
  constructor(private readonly tokens: Record<string, IdentidadExterna>) {}

  async verificar(token: string): Promise<IdentidadExterna> {
    const encontrada = this.tokens[token];
    if (!encontrada) {
      throw new NoAutenticadoError(
        'Tu sesión no es válida o venció. Inicia sesión de nuevo.',
      );
    }
    return encontrada;
  }
}
