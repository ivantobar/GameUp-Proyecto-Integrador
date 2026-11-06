import { useCallback } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import type { Assignment } from '@/data/types';
import {
  gameBadge,
  gameCatalog,
  gameSections,
  nextAssignment,
  type GameDefinition,
  type GameSectionId,
} from './catalog';

export interface GameListItem {
  game: GameDefinition;
  badge: string | undefined;
  /**
   * Tarea que abre la tarjeta (la de la insignia «Tarea»), o `null`: el
   * juego se abre libre.
   */
  assignment: Assignment | null;
}

export interface GameListSection {
  id: GameSectionId;
  title: string;
  items: GameListItem[];
}

/** Juegos agrupados por sección, con su insignia (Tarea o Nuevo). */
export function useGameList() {
  const { students, assignments } = useRepositories();

  const load = useCallback(async (): Promise<GameListSection[]> => {
    const student = await students.getCurrentStudent();
    const pending = await assignments.listPendingForStudent(student.id);
    return gameSections.map((section) => ({
      ...section,
      items: gameCatalog
        .filter((game) => game.section === section.id)
        .map((game) => ({
          game,
          badge: gameBadge(game, pending),
          assignment: nextAssignment(pending, game.id),
        })),
    }));
  }, [students, assignments]);

  return useResource(load);
}
