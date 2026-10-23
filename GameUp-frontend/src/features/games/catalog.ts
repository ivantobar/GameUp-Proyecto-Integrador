import type { Href } from 'expo-router';
import type { IconName } from '@/components/ui';
import type { GameCardTone } from '@/components/gameup';
import type { Assignment, GameId } from '@/data/types';

export type GameSectionId = 'sounds' | 'thinking';

export interface GameDefinition {
  id: GameId;
  title: string;
  subtitle: string;
  icon: IconName;
  section: GameSectionId;
  tone: GameCardTone;
  /** Juego recién agregado a la app (insignia «Nuevo»). */
  isNewGame: boolean;
  /** Pantalla del juego. `null` = todavía en construcción. */
  href: Href | null;
}

export const gameSections: readonly { id: GameSectionId; title: string }[] = [
  { id: 'sounds', title: 'Sonidos y palabras' },
  { id: 'thinking', title: 'Pensar y recordar' },
];

/**
 * Catálogo de juegos (abierto/cerrado): agregar un juego es agregar una
 * entrada aquí; la pantalla Juegos no cambia.
 *
 * - Emparejar, Clasificar, Secuenciar y Memoria aún no tienen mockup.
 */
export const gameCatalog: readonly GameDefinition[] = [
  {
    id: 'speak',
    title: 'Habla conmigo',
    subtitle: 'Mira, oye y dilo',
    icon: 'mic',
    section: 'sounds',
    tone: 'brand',
    isNewGame: true,
    href: '/student/speak',
  },
  {
    id: 'findMouth',
    title: 'Busca la boca',
    subtitle: 'Oye y toca',
    icon: 'ear',
    section: 'sounds',
    tone: 'warm',
    isNewGame: true,
    href: '/student/find-mouth',
  },
  {
    id: 'match',
    title: 'Emparejar',
    subtitle: 'Une las parejas',
    icon: 'match',
    section: 'thinking',
    tone: 'surface',
    isNewGame: false,
    href: null,
  },
  {
    id: 'classify',
    title: 'Clasificar',
    subtitle: 'Cada uno a su grupo',
    icon: 'classify',
    section: 'thinking',
    tone: 'surface',
    isNewGame: false,
    href: null,
  },
  {
    id: 'sequence',
    title: 'Secuenciar',
    subtitle: 'Ordena los pasos',
    icon: 'sequence',
    section: 'thinking',
    tone: 'surface',
    isNewGame: false,
    href: null,
  },
  {
    id: 'memory',
    title: 'Memoria',
    subtitle: 'Voltea dos cartas',
    icon: 'memory',
    section: 'thinking',
    tone: 'surface',
    isNewGame: false,
    href: null,
  },
];

export function findGame(id: GameId): GameDefinition {
  const game = gameCatalog.find((item) => item.id === id);
  if (!game) throw new Error(`Juego desconocido: ${id}`);
  return game;
}

/** A dónde lleva un juego: su pantalla o «en construcción». */
export function gameHref(game: GameDefinition): Href {
  return (
    game.href ?? {
      pathname: '/student/coming-soon/[game]',
      params: { game: game.id },
    }
  );
}

/**
 * Insignia de un juego:
 * - «Tarea» si el docente lo asignó y el estudiante aún no la ha abierto
 *   (una tarea ya empezada aparece en «Sigue donde ibas»);
 * - si no, «Nuevo» si el juego es nuevo en la app.
 */
export function gameBadge(
  game: GameDefinition,
  pendingAssignments: readonly Assignment[],
): string | undefined {
  if (pendingAssignments.some((a) => a.gameId === game.id && a.isNew)) {
    return 'Tarea';
  }
  if (game.isNewGame) return 'Nuevo';
  return undefined;
}
