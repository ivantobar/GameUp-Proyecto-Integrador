import type { UsuarioAutenticado } from './usuario-autenticado.js';
import type { IdentidadExterna } from './verificador-token.js';

/**
 * Puerto ResolutorUsuario: pasa de la identidad externa (API de seguridad) a
 * la cuenta de GameUP. Lo implementa el módulo de auth (MapeadorRoles +
 * tabla usuario). Lanza `AccesoDenegadoError` (403) si la persona no tiene
 * cuenta en GameUP, está inactiva o su rol no coincide.
 */
export interface ResolutorUsuario {
  resolver(identidad: IdentidadExterna): Promise<UsuarioAutenticado>;
}

export const RESOLUTOR_USUARIO = Symbol('RESOLUTOR_USUARIO');
