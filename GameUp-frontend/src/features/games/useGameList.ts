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
import { groupByModule, type ModuleTasks } from './moduleTasks';

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
  /** Tareas de la profe, una tarjeta por módulo (vacío si no hay). */
  modules: ModuleTasks[];
  /** Juegos libres: los de pensar abren su nivel; los de sonidos, libres. */
  sections: GameListSection[];
  /** Niveles de la escalera (vacío si no se pudieron leer). */
  levels: GameLevel[];
}

/**
 * Pantalla Juegos, en dos partes que no se mezclan:
 * - las tareas de la profe, agrupadas por módulo (cuentan para su módulo);
 * - los juegos por niveles y de sonidos (la escalera sube con la profe).
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
          badge: gameBadge(game),
          level: myLevels.find((l) => l.gameId === game.id) ?? null,
        })),
    }));
    return {
      studentId: student.id,
      modules: groupByModule(pending),
      sections,
      levels: myLevels,
    };
  }, [students, assignments, levels]);

  return useResource(load);
}
