import type { Request } from 'express';
import type { UsuarioAutenticado } from './usuario-autenticado.js';
import type { IdentidadExterna } from './verificador-token.js';

/**
 * Petición HTTP después de pasar por AuthGuard:
 *  - `usuario`: la cuenta de GameUP (id interno y rol dentro de GameUP).
 *  - `identidad`: lo que dijo GET /api/auth/perfil de la API central
 *    (id_usuario, nombres, apellidos, correo y roles centrales).
 */
export type SolicitudAutenticada = Request & {
  usuario?: UsuarioAutenticado;
  identidad?: IdentidadExterna;
};

/** Extrae el token de "Authorization: Bearer <token>", o null. */
export function extraerTokenBearer(
  cabecera: string | undefined,
): string | null {
  if (!cabecera) return null;
  const [esquema, token, ...resto] = cabecera.trim().split(/\s+/);
  if (resto.length > 0 || !token || esquema?.toLowerCase() !== 'bearer') {
    return null;
  }
  return token;
}
