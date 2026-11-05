/**
 * Puerto VerificadorToken: decide si un token de la API de seguridad es
 * válido y de quién es. Cambiar la forma de verificar (llamar a /perfil,
 * secreto compartido, JWKS) es cambiar el adaptador, no el guard.
 */

/** Lo que la API de seguridad dice de la persona. */
export interface IdentidadExterna {
  /** id_usuario en la API de seguridad. */
  idUsuarioAuth: bigint;
  /**
   * Valores de `nombre_rol` tal como vienen (puede tener varios: tabla
   * rol_usuario). Se comparan por nombre, nunca por id_rol.
   */
  roles: string[];
  nombres: string | null;
  apellidos: string | null;
  correo: string | null;
}

export interface VerificadorToken {
  /**
   * Lanza `NoAutenticadoError` si el token es inválido o venció, y
   * `ServicioExternoNoDisponibleError` si no se puede verificar.
   */
  verificar(token: string): Promise<IdentidadExterna>;
}

export const VERIFICADOR_TOKEN = Symbol('VERIFICADOR_TOKEN');
