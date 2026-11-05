import type { RolGameUp } from '../../../common/auth/usuario-autenticado.js';

/** Roles que entiende la app móvil (GameUp-frontend/src/data/types.ts). */
export type RolApp = 'student' | 'teacher' | 'guardian' | 'director';

/**
 * ÚNICO lugar donde se traducen los roles.
 *
 * API de seguridad (`nombre_rol`) → GameUP:
 *   ADMIN → DIRECTORA, TALLERISTA → TALLERISTA,
 *   ACUDIENTE → ACUDIENTE, ESTUDIANTE → ESTUDIANTE.
 * DONANTE y cualquier rol desconocido no tienen acceso a GameUP.
 * Se compara siempre por nombre, nunca por id_rol.
 */
const EXTERNO_A_GAMEUP: Readonly<Record<string, RolGameUp>> = {
  ADMIN: 'DIRECTORA',
  TALLERISTA: 'TALLERISTA',
  ACUDIENTE: 'ACUDIENTE',
  ESTUDIANTE: 'ESTUDIANTE',
};

const GAMEUP_A_APP: Readonly<Record<RolGameUp, RolApp>> = {
  DIRECTORA: 'director',
  TALLERISTA: 'teacher',
  ACUDIENTE: 'guardian',
  ESTUDIANTE: 'student',
};

/** "  tallerista " → "TALLERISTA"; quita tildes por si acaso. */
function normalizar(nombreRol: string): string {
  // \p{M}: marcas diacríticas que quedan sueltas tras normalizar a NFD.
  return nombreRol.normalize('NFD').replace(/\p{M}/gu, '').trim().toUpperCase();
}

export const MapeadorRoles = {
  /** Un `nombre_rol` externo → rol de GameUP, o null si no tiene acceso. */
  aRolGameUp(nombreRolExterno: string): RolGameUp | null {
    return EXTERNO_A_GAMEUP[normalizar(nombreRolExterno)] ?? null;
  },

  /** Todos los roles de GameUP que dan los roles externos (sin repetir). */
  aRolesGameUp(nombresRolExterno: readonly string[]): RolGameUp[] {
    const roles = nombresRolExterno
      .map((nombre) => MapeadorRoles.aRolGameUp(nombre))
      .filter((rol): rol is RolGameUp => rol !== null);
    return [...new Set(roles)];
  },

  aRolApp(rol: RolGameUp): RolApp {
    return GAMEUP_A_APP[rol];
  },
} as const;
