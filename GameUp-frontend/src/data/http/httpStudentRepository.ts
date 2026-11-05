import type { ApiClient } from '@/services/api';
import type { StudentRepository } from '../repositories';
import type { EstudiantePropioDto } from './dto/estudiantes';
import { toStudentProfile } from './mappers/studentMapper';

/** El backend sabe quién es el estudiante por el token: no se envía su id. */
export function createHttpStudentRepository(api: ApiClient): StudentRepository {
  return {
    getCurrentStudent: async () =>
      toStudentProfile(await api.get<EstudiantePropioDto>('/estudiantes/me')),
  };
}
