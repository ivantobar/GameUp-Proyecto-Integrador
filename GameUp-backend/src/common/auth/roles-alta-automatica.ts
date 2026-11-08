import { esRolGameUp, type RolGameUp } from './usuario-autenticado.js';

/** Valor por defecto de ALTA_AUTOMATICA_ROLES: los cuatro roles. */
export const ALTA_AUTOMATICA_ROLES_POR_DEFECTO =
  'ESTUDIANTE,ACUDIENTE,TALLERISTA,DIRECTORA';

/** Resultado de leer ALTA_AUTOMATICA_ROLES. */
export type LecturaRolesAltaAutomatica =
  { ok: true; roles: RolGameUp[] } | { ok: false; invalidos: string[] };

/**
 * Lee ALTA_AUTOMATICA_ROLES: roles de GameUP separados por comas
 * ("ESTUDIANTE, ACUDIENTE"). Vacía (o solo espacios) = alta automática
 * apagada. Se aceptan espacios alrededor y se ignoran repetidos; cualquier
 * otro valor (minúsculas, ADMIN, DONANTE...) es inválido.
 */
export function leerRolesAltaAutomatica(
  valor: string,
): LecturaRolesAltaAutomatica {
  const partes = valor
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p !== '');
  const invalidos = partes.filter((p) => !esRolGameUp(p));
  if (invalidos.length > 0) return { ok: false, invalidos };
  return { ok: true, roles: [...new Set(partes as RolGameUp[])] };
}
