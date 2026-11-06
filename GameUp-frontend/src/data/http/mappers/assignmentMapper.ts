import { isVowel, type Assignment } from '../../types';
import type { ActividadPendienteDto } from '../dto/asignaciones';
import { toActivityStatus, toGameId } from './gameCodes';
import { requireText } from './responseShape';

/**
 * Actividad pendiente del backend → tarea de la app. El backend devuelve
 * una entrada por actividad (no por asignación): cada una se abre con su
 * `actividadId`.
 */
export function toAssignment(dto: ActividadPendienteDto): Assignment {
  const activityId = requireText(dto.actividadId, 'actividadId');
  const assignment: Assignment = {
    id: `${requireText(dto.asignacionId, 'asignacionId')}:${activityId}`,
    activityId,
    gameId: toGameId(dto.tipoJuego),
    status: toActivityStatus(dto.estado),
    isNew: dto.esNueva === true,
  };
  if (typeof dto.vocal === 'string' && isVowel(dto.vocal)) {
    assignment.vowel = dto.vocal;
  }
  return assignment;
}
