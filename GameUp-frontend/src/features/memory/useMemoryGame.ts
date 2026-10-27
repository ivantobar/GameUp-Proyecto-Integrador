import { useCallback, useReducer } from 'react';
import { memoryBoards } from '@/data/mock/gameContent';
import type { PictureFace } from '@/data/types';
import { useNarration } from '@/features/narration/useNarration';
import {
  cardView,
  createMemory,
  currentCards,
  isBoardSolved,
  isLastBoard,
  memoryReducer,
  type MemoryState,
} from './memoryGame';

export const MEMORY_INSTRUCTION = 'Voltea dos cartas iguales';

/**
 * Estado y acciones de «Memoria». La pantalla solo pinta.
 * Contenido de ejemplo: `memoryBoards` (ver `data/mock/gameContent.ts`).
 */
export function useMemoryGame(onFinish: (state: MemoryState) => void) {
  const [state, dispatch] = useReducer(memoryReducer, memoryBoards, (boards) =>
    createMemory(boards),
  );
  const { narrate } = useNarration();
  const board = memoryBoards[state.board];
  const faceOf = useCallback(
    (faceId: string): PictureFace | undefined =>
      board?.pairs.find((face) => face.id === faceId),
    [board],
  );

  const cards = currentCards(state).map((card, index) => ({
    key: card.key,
    face: faceOf(card.faceId),
    view: cardView(state, index),
  }));
  const solved = isBoardSolved(state);
  const isLast = isLastBoard(state);

  const flip = useCallback(
    (index: number) => {
      const after = memoryReducer(state, { type: 'flip', index });
      if (after === state) return;
      const face = faceOf(currentCards(state)[index]?.faceId ?? '');
      // Se oye el nombre de cada carta: ayuda a quien todavía no lee.
      if (after.matched.length > state.matched.length) {
        narrate(`¡${face?.label ?? ''}! Son iguales`);
      } else if (face) {
        narrate(face.label);
      }
      dispatch({ type: 'flip', index });
    },
    [state, faceOf, narrate],
  );

  /** «Siguiente»; en el último tablero, termina el juego. */
  const next = useCallback(() => {
    if (!solved) return;
    dispatch({ type: 'next' });
    // PENDIENTE (backend): aquí se enviará el resultado para el docente.
    if (isLast) onFinish(state);
  }, [solved, isLast, state, onFinish]);

  return {
    cards,
    index: state.board,
    total: state.boards.length,
    solved,
    /** Hay dos cartas distintas a la vista. */
    mismatch: state.open.length === 2,
    isLast,
    sayInstruction: () => narrate(MEMORY_INSTRUCTION),
    flip,
    next,
  };
}
