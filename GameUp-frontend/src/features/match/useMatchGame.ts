import { useCallback, useEffect, useState } from 'react';
import { matchRounds } from '@/data/mock/gameContent';
import type { MatchRound } from '@/data/types';
import { shuffle, type Random } from '@/features/games/shuffle';
import type { TurnGameState } from '@/features/games/turnGame';
import { useTurnGame } from '@/features/games/useTurnGame';
import { useNarration } from '@/features/narration/useNarration';

/** Las opciones cambian de lugar en cada partida. */
export function prepareMatchRounds(
  rounds: readonly MatchRound[],
  random: Random,
): MatchRound[] {
  return rounds.map((round) => ({
    ...round,
    options: shuffle(round.options, random),
  }));
}

/**
 * Estado y acciones de «Emparejar». La pantalla solo pinta.
 * Contenido de ejemplo: `matchRounds` (ver `data/mock/gameContent.ts`).
 */
export function useMatchGame(onFinish: (state: TurnGameState) => void) {
  const [rounds] = useState(() => prepareMatchRounds(matchRounds, Math.random));
  const { narrate } = useNarration();
  const { state, isLast, answer, next } = useTurnGame(
    rounds.map(() => 1),
    onFinish,
  );
  const round = rounds[state.round];

  const sayQuestion = useCallback(() => {
    if (round) narrate(`${round.question} ${round.prompt.label}`);
  }, [narrate, round]);

  // Cada ronda nueva empieza leyendo la pregunta.
  useEffect(() => {
    sayQuestion();
  }, [sayQuestion]);

  const choose = useCallback(
    (optionId: string) => {
      if (!round) return;
      const correct = optionId === round.answerId;
      if (correct) narrate('¡Muy bien!');
      answer(correct);
    },
    [round, answer, narrate],
  );

  return {
    round,
    index: state.round,
    total: rounds.length,
    phase: state.phase,
    isLast,
    sayQuestion,
    choose,
    next,
  };
}
