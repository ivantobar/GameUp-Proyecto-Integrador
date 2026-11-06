import { useCallback } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import type { ThinkingGameId } from '@/data/types';
import { parseActivityId } from './delivery';
import type { ContentOf } from './useActivityContent';

/**
 * Parámetros de ruta de un juego de «Pensar y recordar» (alias de tipo:
 * `useLocalSearchParams` no acepta una interfaz).
 */
export type GameRouteParams = {
  /** Abierto desde una tarea (su resultado llega a la profe). */
  actividadId?: string;
  /** `'1'`: abierto en el nivel actual de su escalera (también llega). */
  escalera?: string;
};

/** De dónde sale lo que se juega y a dónde va el resultado. */
export interface GameSource<G extends ThinkingGameId> {
  /** Contenido de la tarea o del nivel; `null` = contenido de ejemplo. */
  content: ContentOf<G> | null;
  /** Actividad a la que se envía el resultado; `null` = juego libre. */
  activityId: string | null;
  /** Es el nivel actual de la escalera (para «Jugar otra vez»). */
  ladder: boolean;
}

export function isLadderRoute(params: GameRouteParams): boolean {
  const value: unknown = params.escalera;
  return (Array.isArray(value) ? value[0] : value) === '1';
}

/**
 * Contenido de Emparejar, Clasificar, Secuenciar o Memoria:
 * - con `actividadId`, el de esa tarea;
 * - con `escalera=1`, el del nivel actual del niño en ese juego;
 * - si no, el juego libre con su contenido de ejemplo (no se envía).
 */
export function useGameContent<G extends ThinkingGameId>(
  params: GameRouteParams,
  gameId: G,
) {
  const { activities, levels } = useRepositories();
  const activityId = parseActivityId(params.actividadId);
  const ladder = !activityId && isLadderRoute(params);

  const load = useCallback(async (): Promise<GameSource<G>> => {
    const content = activityId
      ? await activities.getActivity(activityId)
      : ladder
        ? (await levels.getCurrentLevelActivity(gameId)).content
        : null;
    if (content === null) return { content: null, activityId: null, ladder };
    if (content.gameId !== gameId) {
      throw new Error('La actividad no es de este juego');
    }
    return {
      content: content as ContentOf<G>,
      activityId: content.activityId,
      ladder,
    };
  }, [activities, levels, activityId, ladder, gameId]);

  return useResource(load);
}
