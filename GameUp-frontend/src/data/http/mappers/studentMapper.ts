import type { StudentProfile } from '../../types';
import type { EstudiantePropioDto } from '../dto/estudiantes';
import { requireText } from './responseShape';

/** Estudiante con sesión, a partir de `GET /estudiantes/me`. */
export function toStudentProfile(dto: EstudiantePropioDto): StudentProfile {
  return {
    id: requireText(dto.id, 'id'),
    displayName: requireText(dto.displayName, 'displayName'),
  };
}
