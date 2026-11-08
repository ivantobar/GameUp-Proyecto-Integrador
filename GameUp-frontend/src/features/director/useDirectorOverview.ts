import { useCallback } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';

/** Cada cifra, o `null` si su consulta falló («No disponible»). */
export interface DirectorOverview {
  students: number | null;
  pendingReviews: number | null;
  assigned: number | null;
  inProgress: number | null;
  completed: number | null;
}

/** Ninguna consulta respondió: la pantalla muestra el error. */
export class OverviewUnavailableError extends Error {
  constructor() {
    super('No se pudo cargar ninguna cifra del resumen.');
    this.name = 'OverviewUnavailableError';
  }
}

/**
 * «Resumen» de la directora: cinco cifras con endpoints que ya existen. Si
 * falla una, esa tarjeta dice «No disponible» y las demás se muestran; solo
 * si fallan todas es un error de la pantalla.
 */
export function useDirectorOverview() {
  const { overview } = useRepositories();

  const load = useCallback(async (): Promise<DirectorOverview> => {
    const results = await Promise.allSettled([
      overview.countStudents(),
      overview.countPendingReviews(),
      overview.countAssignments('assigned'),
      overview.countAssignments('inProgress'),
      overview.countAssignments('completed'),
    ]);
    if (results.every((r) => r.status === 'rejected')) {
      throw new OverviewUnavailableError();
    }
    const [students, pendingReviews, assigned, inProgress, completed] =
      results.map((r) => (r.status === 'fulfilled' ? r.value : null));
    return {
      students: students ?? null,
      pendingReviews: pendingReviews ?? null,
      assigned: assigned ?? null,
      inProgress: inProgress ?? null,
      completed: completed ?? null,
    };
  }, [overview]);

  return useResource(load);
}
