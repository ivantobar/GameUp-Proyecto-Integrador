import type { IdentidadExterna } from '../../src/common/auth/verificador-token.js';
import { ServicioExternoNoDisponibleError } from '../../src/common/errors/dominio.errors.js';
import type { DirectorioCentral } from '../../src/modules/auth/domain/directorio-central.js';

/**
 * Simula GET /api/usuarios/{id} de la API central: devuelve las personas
 * que se le dan (por id_usuario) y null para las demás (404).
 * Con `caida = true`, la API central "no responde".
 */
export class DirectorioCentralFalso implements DirectorioCentral {
  caida = false;
  /** Pares (id_usuario, token) consultados, para comprobar el token usado. */
  readonly consultas: Array<{ idUsuarioAuth: bigint; token: string }> = [];

  constructor(private readonly personas: IdentidadExterna[] = []) {}

  agregar(persona: IdentidadExterna): void {
    this.personas.push(persona);
  }

  async buscar(
    idUsuarioAuth: bigint,
    token: string,
  ): Promise<IdentidadExterna | null> {
    this.consultas.push({ idUsuarioAuth, token });
    if (this.caida) {
      throw new ServicioExternoNoDisponibleError(
        'La API central no responde (prueba).',
      );
    }
    return this.personas.find((p) => p.idUsuarioAuth === idUsuarioAuth) ?? null;
  }
}
