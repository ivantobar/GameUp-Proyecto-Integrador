/**
 * Lógica pura compartida por Emparejar, Clasificar y Secuenciar (sin React),
 * para poder probarla sola.
 *
 * Un juego tiene rondas (una pantalla cada una) y cada ronda tiene turnos:
 * - Emparejar: 1 turno por ronda (elegir la tarjeta que va);
 * - Clasificar: 1 turno por elemento (llevarlo a su grupo);
 * - Secuenciar: 1 turno por paso (tocar el que sigue).
 *
 * Reglas pedagógicas:
 * - Sin tiempo límite, sin vidas y sin puntaje negativo.
 * - Equivocarse no resta: pasa a «pista» (se resalta lo correcto) y el niño
 *   vuelve a intentar las veces que quiera.
 * - La ronda queda resuelta al completar todos sus turnos; solo entonces se
 *   habilita «Siguiente».
 */

/** Estado del turno actual: preguntando, con pista, o ronda resuelta. */
export type TurnPhase = 'asking' | 'hinted' | 'solved';

export interface TurnGameState {
  /** Cuántos turnos tiene cada ronda. */
  turnsPerRound: readonly number[];
  round: number;
  /** Turno actual dentro de la ronda (= turnos hechos). */
  turn: number;
  phase: TurnPhase;
  /** Turnos resueltos al primer intento (información para el docente). */
  firstTryCorrect: number;
  finished: boolean;
}

export type TurnGameAction =
  { type: 'answer'; correct: boolean } | { type: 'next' };

export function createTurnGame(
  turnsPerRound: readonly number[],
): TurnGameState {
  return {
    turnsPerRound,
    round: 0,
    turn: 0,
    phase: 'asking',
    firstTryCorrect: 0,
    finished: false,
  };
}

/** Total de turnos del juego (para el resultado). */
export function totalTurns(state: TurnGameState): number {
  return state.turnsPerRound.reduce((sum, turns) => sum + turns, 0);
}

export function isLastRound(state: TurnGameState): boolean {
  return state.round >= state.turnsPerRound.length - 1;
}

export function turnGameReducer(
  state: TurnGameState,
  action: TurnGameAction,
): TurnGameState {
  const turns = state.turnsPerRound[state.round];
  if (turns === undefined || state.finished) return state;

  switch (action.type) {
    case 'answer': {
      if (state.phase === 'solved') return state;
      // Equivocarse no resta nada: solo se muestra la pista.
      if (!action.correct) return { ...state, phase: 'hinted' };
      const turn = state.turn + 1;
      return {
        ...state,
        turn,
        phase: turn >= turns ? 'solved' : 'asking',
        firstTryCorrect:
          state.phase === 'asking'
            ? state.firstTryCorrect + 1
            : state.firstTryCorrect,
      };
    }
    case 'next': {
      if (state.phase !== 'solved') return state;
      return isLastRound(state)
        ? { ...state, finished: true }
        : { ...state, round: state.round + 1, turn: 0, phase: 'asking' };
    }
  }
}
