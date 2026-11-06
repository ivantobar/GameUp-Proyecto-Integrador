import type { Href } from 'expo-router';
import type { IconName } from '@/components/ui';
import type { GameCardTone } from '@/components/gameup';
import type { Assignment, GameId, LadderGameId } from '@/data/types';

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
 * - Emparejar, Clasificar, Secuenciar y Memoria no tienen mockup: su
 *   interfaz es una propuesta que sigue el estilo de «Busca la boca».
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
    href: '/student/match',
  },
  {
    id: 'classify',
    title: 'Clasificar',
    subtitle: 'Cada uno a su grupo',
    icon: 'classify',
    section: 'thinking',
    tone: 'surface',
    isNewGame: false,
    href: '/student/classify',
  },
  {
    id: 'sequence',
    title: 'Secuenciar',
    subtitle: 'Ordena los pasos',
    icon: 'sequence',
    section: 'thinking',
    tone: 'surface',
    isNewGame: false,
    href: '/student/sequence',
  },
  {
    id: 'memory',
    title: 'Memoria',
    subtitle: 'Voltea dos cartas',
    icon: 'memory',
    section: 'thinking',
    tone: 'surface',
    isNewGame: false,
    href: '/student/memory',
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
 * El juego en el nivel actual de su escalera (fase 9): la pantalla pide la
 * actividad del nivel y su resultado llega a la profe.
 */
export function ladderHref(gameId: LadderGameId): Href {
  const params = { escalera: '1' };
  switch (gameId) {
    case 'match':
      return { pathname: '/student/match', params };
    case 'classify':
      return { pathname: '/student/classify', params };
    case 'sequence':
      return { pathname: '/student/sequence', params };
    case 'memory':
      return { pathname: '/student/memory', params };
  }
}

/**
 * ¿La tarea se ofrece para abrirla? Las nuevas (sin abrir) y las que el
 * docente pidió practicar otra vez. Una ya empezada aparece en «Sigue donde
 * ibas».
 */
function isOffered(assignment: Assignment): boolean {
  return assignment.isNew || assignment.status === 'rejected';
}

/**
 * Próxima tarea para abrir (de un juego, o de cualquiera): primero las
 * nuevas y luego las que el docente pidió repetir. `null` si no hay.
 */
export function nextAssignment(
  pendingAssignments: readonly Assignment[],
  gameId?: GameId,
): Assignment | null {
  const offered = pendingAssignments.filter(
    (a) => isOffered(a) && (gameId === undefined || a.gameId === gameId),
  );
  return offered.find((a) => a.isNew) ?? offered[0] ?? null;
}

/**
 * Insignia de un juego:
 * - «Tarea» si tiene una tarea para abrir (nueva o para repetir);
 * - si no, «Nuevo» si el juego es nuevo en la app.
 */
export function gameBadge(
  game: GameDefinition,
  pendingAssignments: readonly Assignment[],
): string | undefined {
  if (nextAssignment(pendingAssignments, game.id)) return 'Tarea';
  if (game.isNewGame) return 'Nuevo';
  return undefined;
}

/**
 * A dónde lleva una tarea: al juego, con `actividadId` en la ruta para que
 * el resultado llegue al docente. «Habla conmigo» va directo a su vocal.
 * Sin actividad (o sin vocal), el juego se abre libre.
 */
export function assignmentHref(assignment: Assignment): Href {
  const game = findGame(assignment.gameId);
  const actividadId = assignment.activityId;
  if (!actividadId) return gameHref(game);
  switch (assignment.gameId) {
    case 'speak':
      return assignment.vowel
        ? {
            pathname: '/student/speak/[vowel]/look',
            params: { vowel: assignment.vowel, actividadId },
          }
        : gameHref(game);
    case 'findMouth':
      return { pathname: '/student/find-mouth', params: { actividadId } };
    case 'match':
      return { pathname: '/student/match', params: { actividadId } };
    case 'classify':
      return { pathname: '/student/classify', params: { actividadId } };
    case 'sequence':
      return { pathname: '/student/sequence', params: { actividadId } };
    case 'memory':
      return { pathname: '/student/memory', params: { actividadId } };
  }
}
