import { useCallback } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import type { Assignment, GameLevel } from '@/data/types';
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
   * juego se abre en su nivel (si tiene escalera) o libre.
   */
  assignment: Assignment | null;
  /** Nivel en la escalera; `null` si el juego no tiene o no se pudo leer. */
  level: GameLevel | null;
}

export interface GameListSection {
  id: GameSectionId;
  title: string;
  items: GameListItem[];
}

export interface GameList {
  studentId: string;
  sections: GameListSection[];
  /** Niveles de la escalera (vacío si no se pudieron leer). */
  levels: GameLevel[];
}

/**
 * Juegos agrupados por sección, con su insignia (Tarea o Nuevo) y su nivel.
 * Si los niveles no cargan, los juegos se muestran igual (sin estrellas).
 */
export function useGameList() {
  const { students, assignments, levels } = useRepositories();

  const load = useCallback(async (): Promise<GameList> => {
    const student = await students.getCurrentStudent();
    const [pending, myLevels] = await Promise.all([
      assignments.listPendingForStudent(student.id),
      levels.getMyLevels().catch((error: unknown) => {
        console.warn(
          '[GameUP] No se pudieron cargar los niveles',
          error instanceof Error ? error.name : 'Error',
        );
        return [] as GameLevel[];
      }),
    ]);
    const sections = gameSections.map((section) => ({
      ...section,
      items: gameCatalog
        .filter((game) => game.section === section.id)
        .map((game) => ({
          game,
          badge: gameBadge(game, pending),
          assignment: nextAssignment(pending, game.id),
          level: myLevels.find((l) => l.gameId === game.id) ?? null,
        })),
    }));
    return { studentId: student.id, sections, levels: myLevels };
  }, [students, assignments, levels]);

  return useResource(load);
}
