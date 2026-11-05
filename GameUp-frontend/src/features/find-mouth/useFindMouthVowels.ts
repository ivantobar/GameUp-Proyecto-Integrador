import { useCallback } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import { VOWELS, type Vowel } from '@/data/types';

/**
 * Vocales de «Busca la boca»: las de la actividad asignada, o las cinco si
 * el juego se abrió libre (sin pedir nada al servidor).
 */
export function useFindMouthVowels(activityId: string | null) {
  const { activities } = useRepositories();

  const load = useCallback(async (): Promise<readonly Vowel[]> => {
    if (!activityId) return VOWELS;
    const activity = await activities.getActivity(activityId);
    if (activity.gameId !== 'findMouth') {
      throw new Error('La actividad no es de Busca la boca');
    }
    return activity.vowels;
  }, [activities, activityId]);

  return useResource(load);
}
