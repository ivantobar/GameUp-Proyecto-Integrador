import type { ApiClient } from '@/services/api';
import type { StaffRepository } from '../repositories';
import type { SesionUsuarioDto } from './dto/auth';
import { toStaffProfile } from './mappers/sessionMapper';

/**
 * Docente y acudiente con sesión. Los dos salen de `GET /auth/me`: el
 * backend no tiene un perfil propio de cada rol, y el que se ve es siempre
 * el de quien tiene la sesión.
 */
export function createHttpStaffRepository(api: ApiClient): StaffRepository {
  const currentUser = async () =>
    toStaffProfile(await api.get<SesionUsuarioDto>('/auth/me'));

  return {
    getCurrentStaff: currentUser,
    getCurrentTeacher: currentUser,
    getCurrentGuardian: currentUser,
  };
}
