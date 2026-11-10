import { useCallback } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';

/**
 * Lista de «Por revisar» (docente) y «Por validar» (directora): cada
 * estudiante con actividades por revisar, del que más tiempo lleva
 * esperando al que menos. El backend decide a quiénes ve la sesión.
 */
export function usePendingSummary() {
  const { staff, reviews } = useRepositories();
  const load = useCallback(async () => {
    const adult = await staff.getCurrentStaff();
    return reviews.listPendingSummary(adult.id);
  }, [staff, reviews]);
  return useResource(load);
}
