import type { ApiClient } from '@/services/api';
import type { OverviewRepository } from '../repositories';
import type { AssignmentState } from '../types';
import type { EstadoAsignacion } from './dto/asignaciones';
import { requireCount } from './mappers/responseShape';

const estados: Record<AssignmentState, EstadoAsignacion> = {
  assigned: 'ASIGNADO',
  inProgress: 'EN_CURSO',
  completed: 'COMPLETADO',
};

/**
 * «Resumen» con endpoints que ya existen: se pide una sola fila
 * (`limit=1`) y se lee el `total` de la página.
 */
export function createHttpOverviewRepository(
  api: ApiClient,
): OverviewRepository {
  const totalOf = async (path: string) =>
    requireCount((await api.get<{ total?: unknown }>(path)).total, 'total');

  return {
    countStudents: () => totalOf('/estudiantes?limit=1'),
    countPendingReviews: () => totalOf('/revisiones/pendientes?limit=1'),
    countAssignments: (state) =>
      totalOf(`/asignaciones?estado=${estados[state]}&limit=1`),
  };
}
