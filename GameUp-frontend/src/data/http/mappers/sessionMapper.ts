import type { AuthSession, StaffProfile, UserRole } from '../../types';
import type { SesionUsuarioDto } from '../dto/auth';
import { requireText, unexpected } from './responseShape';

const ROLES: readonly UserRole[] = [
  'student',
  'teacher',
  'guardian',
  'director',
];

/**
 * El backend ya traduce el rol de GameUP (ESTUDIANTE, TALLERISTA, ACUDIENTE,
 * DIRECTORA) a los códigos de la app. Aquí solo se comprueba que sea uno de
 * ellos. El rol decide a qué pantalla ir; los permisos los verifica el backend.
 */
export function toUserRole(value: unknown): UserRole {
  if (
    typeof value === 'string' &&
    (ROLES as readonly string[]).includes(value)
  ) {
    return value as UserRole;
  }
  throw unexpected('role');
}

export function toAuthSession(dto: SesionUsuarioDto): AuthSession {
  return {
    userId: requireText(dto.userId, 'userId'),
    role: toUserRole(dto.role),
    displayName: requireText(dto.displayName, 'displayName'),
  };
}

/** Docente o acudiente con sesión, a partir de `GET /auth/me`. */
export function toStaffProfile(dto: SesionUsuarioDto): StaffProfile {
  return {
    id: requireText(dto.userId, 'userId'),
    displayName: requireText(dto.displayName, 'displayName'),
  };
}
