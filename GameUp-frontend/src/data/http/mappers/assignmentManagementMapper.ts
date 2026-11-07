import type {
  AssignableModule,
  AssignmentState,
  NewAssignment,
  StudentAssignment,
} from '../../types';
import type {
  AsignacionDto,
  CrearAsignacionDto,
  EstadoAsignacion,
} from '../dto/asignaciones';
import type { ModuloDto } from '../dto/modulos';
import { requireCount, requireText, unexpected } from './responseShape';

const states: Record<EstadoAsignacion, AssignmentState> = {
  ASIGNADO: 'assigned',
  EN_CURSO: 'inProgress',
  COMPLETADO: 'completed',
};

/** Asignación del backend → la de la app. */
export function toStudentAssignment(dto: AsignacionDto): StudentAssignment {
  const state = states[dto.estado];
  if (!state) throw unexpected('estado');
  const progress = requireCount(dto.progreso, 'progreso');
  return {
    id: requireText(dto.id, 'id'),
    moduleId: requireText(dto.modulo?.id, 'modulo.id'),
    moduleTitle: requireText(dto.modulo?.nombre, 'modulo.nombre'),
    state,
    progress: Math.min(progress, 100),
    suggestedDate: dto.fechaSugerida ?? null,
  };
}

/** Módulo del backend → módulo que se puede asignar. */
export function toAssignableModule(dto: ModuloDto): AssignableModule {
  return {
    id: requireText(dto.id, 'id'),
    title: requireText(dto.nombre, 'nombre'),
    description: dto.descripcion?.trim() || null,
    category: dto.categoria?.nombre ?? '',
  };
}

/**
 * Cuerpo de `POST /asignaciones` con los nombres exactos del backend. Sin
 * fecha, `fechaSugerida` no se envía.
 */
export function toCreateAssignmentBody(
  input: NewAssignment,
): CrearAsignacionDto {
  return {
    moduloId: input.moduleId,
    estudianteId: input.studentId,
    ...(input.suggestedDate ? { fechaSugerida: input.suggestedDate } : {}),
  };
}
