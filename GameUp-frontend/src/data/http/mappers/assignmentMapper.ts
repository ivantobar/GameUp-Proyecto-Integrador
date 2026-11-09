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
  // Datos para agrupar por módulo: si faltan, la tarea se muestra igual.
  if (typeof dto.titulo === 'string' && dto.titulo.trim() !== '') {
    assignment.title = dto.titulo;
  }
  const modulo: unknown = dto.modulo;
  if (typeof modulo === 'object' && modulo !== null) {
    const { id, nombre } = modulo as { id?: unknown; nombre?: unknown };
    if (typeof id === 'string' && id !== '') assignment.moduleId = id;
    if (typeof nombre === 'string' && nombre.trim() !== '') {
      assignment.moduleTitle = nombre;
    }
  }
  if (typeof dto.orden === 'number' && Number.isFinite(dto.orden)) {
    assignment.order = dto.orden;
  }
  return assignment;
}
