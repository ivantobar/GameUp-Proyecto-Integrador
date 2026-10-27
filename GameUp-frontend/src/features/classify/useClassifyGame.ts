import { useCallback, useEffect, useState } from 'react';
import { classifySets } from '@/data/mock/gameContent';
import type { ClassifySet } from '@/data/types';
import { shuffle, type Random } from '@/features/games/shuffle';
import type { TurnGameState } from '@/features/games/turnGame';
import { useTurnGame } from '@/features/games/useTurnGame';
import { useNarration } from '@/features/narration/useNarration';

/** Los elementos salen en otro orden en cada partida. */
export function prepareClassifySets(
  sets: readonly ClassifySet[],
  random: Random,
): ClassifySet[] {
  return sets.map((set) => ({ ...set, items: shuffle(set.items, random) }));
}

/**
 * Estado y acciones de «Clasificar»: un elemento a la vez; el niño toca el
 * grupo al que pertenece. Contenido de ejemplo: `classifySets`.
 */
export function useClassifyGame(onFinish: (state: TurnGameState) => void) {
  const [sets] = useState(() => prepareClassifySets(classifySets, Math.random));
  const { narrate } = useNarration();
  const { state, isLast, answer, next } = useTurnGame(
    sets.map((set) => set.items.length),
    onFinish,
  );
  const set = sets[state.round];
  /** Elemento por ubicar; `undefined` cuando la ronda está resuelta. */
  const item = state.phase === 'solved' ? undefined : set?.items[state.turn];
  /** Elementos ya ubicados en su grupo. */
  const placed = set?.items.slice(0, state.turn) ?? [];

  const sayItem = useCallback(() => {
    if (set && item) narrate(`${set.question} ${item.label}`);
  }, [narrate, set, item]);

  // Cada elemento nuevo se anuncia.
  useEffect(() => {
    sayItem();
  }, [sayItem]);

  const choose = useCallback(
    (categoryId: string) => {
      if (!item) return;
      answer(item.categoryId === categoryId);
    },
    [item, answer],
  );

  return {
    set,
    item,
    placed,
    index: state.round,
    total: sets.length,
    phase: state.phase,
    isLast,
    sayItem,
    choose,
    next,
  };
}
