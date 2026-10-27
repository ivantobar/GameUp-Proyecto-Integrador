import type { MemoryBoard } from '@/data/types';
import { shuffle, type Random } from '@/features/games/shuffle';

/**
 * Lógica pura de «Memoria» (sin React), para poder probarla sola.
 *
 * Reglas pedagógicas:
 * - Sin tiempo límite: las cartas NO se voltean solas con un temporizador.
 *   Si las dos cartas no son pareja, se quedan a la vista hasta que el niño
 *   toque otra carta; entonces se cierran y se abre la nueva.
 * - Sin vidas ni puntaje: los intentos fallidos solo se cuentan como
 *   información para el docente.
 */

export interface MemoryCard {
  /** Único en el tablero («perro-1», «perro-2»). */
  key: string;
  /** Las dos cartas de una pareja comparten `faceId`. */
  faceId: string;
}

export interface MemoryState {
  boards: MemoryCard[][];
  board: number;
  /** Posiciones boca arriba que aún no son pareja (0, 1 o 2). */
  open: number[];
  /** Parejas encontradas en el tablero actual. */
  matched: string[];
  /** Veces que abrió dos cartas distintas (información para el docente). */
  mismatches: number;
  finished: boolean;
}

export type MemoryAction = { type: 'flip'; index: number } | { type: 'next' };

/** Cómo se ve cada carta. */
export type MemoryCardView = 'down' | 'up' | 'mismatch' | 'matched';

export function buildBoard(board: MemoryBoard, random: Random): MemoryCard[] {
  const cards = board.pairs.flatMap((face) => [
    { key: `${face.id}-1`, faceId: face.id },
    { key: `${face.id}-2`, faceId: face.id },
  ]);
  return shuffle(cards, random);
}

export function createMemory(
  boards: readonly MemoryBoard[],
  random: Random = Math.random,
): MemoryState {
  return {
    boards: boards.map((board) => buildBoard(board, random)),
    board: 0,
    open: [],
    matched: [],
    mismatches: 0,
    finished: false,
  };
}

export function currentCards(state: MemoryState): MemoryCard[] {
  return state.boards[state.board] ?? [];
}

/** El tablero está resuelto cuando todas sus parejas están a la vista. */
export function isBoardSolved(state: MemoryState): boolean {
  const cards = currentCards(state);
  return cards.length > 0 && state.matched.length * 2 === cards.length;
}

export function isLastBoard(state: MemoryState): boolean {
  return state.board >= state.boards.length - 1;
}

export function cardView(state: MemoryState, index: number): MemoryCardView {
  const card = currentCards(state)[index];
  if (!card) return 'down';
  if (state.matched.includes(card.faceId)) return 'matched';
  if (state.open.includes(index)) {
    return state.open.length === 2 ? 'mismatch' : 'up';
  }
  return 'down';
}

export function memoryReducer(
  state: MemoryState,
  action: MemoryAction,
): MemoryState {
  if (state.finished) return state;

  switch (action.type) {
    case 'flip': {
      const cards = currentCards(state);
      const card = cards[action.index];
      if (!card || isBoardSolved(state)) return state;
      if (state.matched.includes(card.faceId)) return state;
      if (state.open.includes(action.index)) return state;

      // Había dos distintas a la vista: se cierran y se abre la nueva.
      if (state.open.length !== 1) return { ...state, open: [action.index] };

      const first = cards[state.open[0] ?? -1];
      if (first?.faceId === card.faceId) {
        return { ...state, open: [], matched: [...state.matched, card.faceId] };
      }
      return {
        ...state,
        open: [...state.open, action.index],
        mismatches: state.mismatches + 1,
      };
    }
    case 'next': {
      if (!isBoardSolved(state)) return state;
      return isLastBoard(state)
        ? { ...state, finished: true }
        : { ...state, board: state.board + 1, open: [], matched: [] };
    }
  }
}
