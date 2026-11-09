import type { StaffProfile, StudentTeacher } from '../../types';
import type { TalleristaAsignadaDto, UsuarioDto } from '../dto/talleristas';
import { requireText, unexpected } from './responseShape';

export function toStudentTeacher(dto: TalleristaAsignadaDto): StudentTeacher {
  if (typeof dto.activo !== 'boolean') {
    throw unexpected('tallerista.activo');
  }
  return {
    teacherId: requireText(dto.talleristaId, 'tallerista.talleristaId'),
    displayName: requireText(dto.displayName, 'tallerista.displayName'),
    since: requireText(dto.fechaInicio, 'tallerista.fechaInicio'),
    active: dto.activo,
  };
}

/**
 * Primer nombre y primer apellido, como lo arma el backend para las
 * talleristas de un estudiante («Ana María» + «Gómez Ruiz» → «Ana Gómez»).
 */
export function personName(nombres: string, apellidos: string): string {
  const [first = ''] = nombres.trim().split(/\s+/);
  const [surname] = apellidos.trim().split(/\s+/);
  return surname ? `${first} ${surname}` : first;
}

export function toTeacherOption(dto: UsuarioDto): StaffProfile {
  return {
    id: requireText(dto.id, 'usuario.id'),
    displayName: personName(dto.nombres ?? '', dto.apellidos ?? ''),
  };
}
