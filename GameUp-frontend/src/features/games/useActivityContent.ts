import { useCallback } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import type { ActivityContent, GameId } from '@/data/types';

/** Contenido de una actividad de un juego concreto. */
export type ContentOf<G extends GameId> = Extract<
  ActivityContent,
  { gameId: G }
>;

function isContentOf<G extends GameId>(
  content: ActivityContent,
  gameId: G,
): content is ContentOf<G> {
  return content.gameId === gameId;
}

/**
 * Contenido del juego que se abrió desde una tarea (`actividadId`), o
 * `null` si se abrió libre: entonces el juego usa su contenido de ejemplo y
 * no se pide nada al servidor.
 */
export function useActivityContent<G extends GameId>(
  activityId: string | null,
  gameId: G,
) {
  const { activities } = useRepositories();

  const load = useCallback(async (): Promise<ContentOf<G> | null> => {
    if (!activityId) return null;
    const content = await activities.getActivity(activityId);
    if (!isContentOf(content, gameId)) {
      throw new Error('La actividad no es de este juego');
    }
    return content;
  }, [activities, activityId, gameId]);

  return useResource(load);
}
