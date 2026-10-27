import { useCallback, useEffect, useState } from 'react';
import { sequenceRoutines } from '@/data/mock/gameContent';
import type { PictureFace, SequenceRoutine } from '@/data/types';
import { shuffle, type Random } from '@/features/games/shuffle';
import type { TurnGameState } from '@/features/games/turnGame';
import { useTurnGame } from '@/features/games/useTurnGame';
import { useNarration } from '@/features/narration/useNarration';

export interface PreparedRoutine extends SequenceRoutine {
  /** Los mismos pasos, desordenados, para mostrarlos como opciones. */
  shuffled: PictureFace[];
}

/** Desordena los pasos sin dejarlos en el orden correcto (si se puede). */
export function prepareRoutines(
  routines: readonly SequenceRoutine[],
  random: Random,
): PreparedRoutine[] {
  return routines.map((routine) => {
    let shuffled = shuffle(routine.steps, random);
    const inOrder = () =>
      shuffled.every((step, i) => step.id === routine.steps[i]?.id);
    if (routine.steps.length > 1 && inOrder()) {
      // Si quedó igual, el primero pasa al final.
      shuffled = [...shuffled.slice(1), ...shuffled.slice(0, 1)];
    }
    return { ...routine, shuffled };
  });
}

/** Pregunta según el paso que falta: primero, después o al final. */
export function sequenceQuestion(turn: number, steps: number): string {
  if (turn === 0) return '¿Qué va primero?';
  if (turn >= steps - 1) return '¿Qué va al final?';
  return '¿Qué va después?';
}

/**
 * Estado y acciones de «Secuenciar»: el niño toca el paso que sigue y este
 * pasa a su casilla. Contenido de ejemplo: `sequenceRoutines`.
 */
export function useSequenceGame(onFinish: (state: TurnGameState) => void) {
  const [routines] = useState(() =>
    prepareRoutines(sequenceRoutines, Math.random),
  );
  const { narrate } = useNarration();
  const { state, isLast, answer, next } = useTurnGame(
    routines.map((routine) => routine.steps.length),
    onFinish,
  );
  const routine = routines[state.round];
  const placed = routine?.steps.slice(0, state.turn) ?? [];
  const expected = routine?.steps[state.turn];
  /** Pasos que aún no están en su casilla. */
  const options =
    routine?.shuffled.filter(
      (step) => !placed.some((done) => done.id === step.id),
    ) ?? [];

  const sayRoutine = useCallback(() => {
    if (routine) narrate(`${routine.title}. ¿Qué va primero?`);
  }, [narrate, routine]);

  // Cada rutina nueva empieza leyendo su nombre.
  useEffect(() => {
    sayRoutine();
  }, [sayRoutine]);

  const choose = useCallback(
    (stepId: string) => {
      if (!expected) return;
      const correct = stepId === expected.id;
      // Al acertar se oye el paso: así el niño repasa la rutina en voz alta.
      if (correct) narrate(expected.label);
      answer(correct);
    },
    [expected, answer, narrate],
  );

  return {
    routine,
    placed,
    expected,
    options,
    index: state.round,
    total: routines.length,
    phase: state.phase,
    isLast,
    sayRoutine,
    choose,
    next,
  };
}
