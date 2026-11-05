import type { Request } from 'express';
import type { UsuarioAutenticado } from './usuario-autenticado.js';

/** Petición HTTP después de pasar por AuthGuard. */
export type SolicitudAutenticada = Request & { usuario?: UsuarioAutenticado };

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
