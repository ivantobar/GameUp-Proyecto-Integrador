import { useCallback, useReducer } from 'react';
import {
  createTurnGame,
  isLastRound,
  turnGameReducer,
  type TurnGameState,
} from './turnGame';

/**
 * Estado y acciones comunes de Emparejar, Clasificar y Secuenciar.
 * `onFinish` se llama al tocar «Terminar» en la última ronda, con el estado
 * final (cuántos turnos resolvió al primer intento).
 */
export function useTurnGame(
  turnsPerRound: readonly number[],
  onFinish: (state: TurnGameState) => void,
) {
  const [state, dispatch] = useReducer(
    turnGameReducer,
    turnsPerRound,
    createTurnGame,
  );

  const answer = useCallback((correct: boolean) => {
    dispatch({ type: 'answer', correct });
  }, []);

  /** «Siguiente»; en la última ronda, termina el juego. */
  const next = useCallback(() => {
    if (state.phase !== 'solved') return;
    dispatch({ type: 'next' });
    // PENDIENTE (backend): aquí se enviará el resultado para que el docente
    // lo valide, como hace «Busca la boca» con `results.submitFindMouthResult`.
    if (isLastRound(state)) onFinish(state);
  }, [state, onFinish]);

  return {
    state,
    isLast: isLastRound(state),
    answer,
    next,
  };
}
