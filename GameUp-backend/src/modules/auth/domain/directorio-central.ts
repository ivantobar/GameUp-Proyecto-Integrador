import type { IdentidadExterna } from '../../../common/auth/verificador-token.js';

/**
 * Puerto DirectorioCentral: busca a una persona en la API central de
 * seguridad por su `id_usuario` (GET /api/usuarios/{id}). Lo usa la
 * directora al dar de alta una cuenta (POST /usuarios), para no escribir
 * nombres, correo ni roles a mano. Solo lectura: nunca crea credenciales.
 */
export interface DirectorioCentral {
  /**
   * La persona con ese id_usuario, o null si la API central no la tiene
   * (404). Se consulta con el token de quien llama (la directora: la API
   * central acepta el token ADMIN).
   *
   * Lanza ServicioExternoNoDisponibleError si la API central no responde,
   * falla o responde con un formato inesperado.
   */
  buscar(
    idUsuarioAuth: bigint,
    token: string,
  ): Promise<IdentidadExterna | null>;
}

export const DIRECTORIO_CENTRAL = Symbol('DIRECTORIO_CENTRAL');
