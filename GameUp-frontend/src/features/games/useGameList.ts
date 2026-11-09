import { useCallback } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import type { GameLevel } from '@/data/types';
import {
  gameBadge,
  gameCatalog,
  gameSections,
  type GameDefinition,
  type GameSectionId,
} from './catalog';

export interface GameListItem {
  game: GameDefinition;
  badge: string | undefined;
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
  /** Juegos libres: los de pensar abren su nivel; los de sonidos, libres. */
  sections: GameListSection[];
  /** Niveles de la escalera (vacío si no se pudieron leer). */
  levels: GameLevel[];
}

/**
 * Pantalla «Jugar por niveles»: los juegos de pensar (abren su nivel; la
 * escalera sube con la profe) y los de sonidos. Las tareas de la profe van
 * aparte, en «Tareas de mi profe». Si los niveles no cargan, los juegos se
 * muestran igual (sin estrellas).
 */
export function useGameList() {
  const { students, levels } = useRepositories();

  const load = useCallback(async (): Promise<GameList> => {
    const student = await students.getCurrentStudent();
    const myLevels = await levels.getMyLevels().catch((error: unknown) => {
      console.warn(
        '[GameUP] No se pudieron cargar los niveles',
        error instanceof Error ? error.name : 'Error',
      );
      return [] as GameLevel[];
    });
    const sections = gameSections.map((section) => ({
      ...section,
      items: gameCatalog
        .filter((game) => game.section === section.id)
        .map((game) => ({
          game,
          badge: gameBadge(game),
          level: myLevels.find((l) => l.gameId === game.id) ?? null,
        })),
    }));
    return {
      studentId: student.id,
      sections,
      levels: myLevels,
    };
  }, [students, levels]);

  return useResource(load);
}
