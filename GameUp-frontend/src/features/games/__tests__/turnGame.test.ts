import {
  createTurnGame,
  isLastRound,
  totalTurns,
  turnGameReducer,
  type TurnGameState,
} from '../turnGame';

const right = { type: 'answer', correct: true } as const;
const wrong = { type: 'answer', correct: false } as const;
const next = { type: 'next' } as const;

function play(
  state: TurnGameState,
  ...actions: Parameters<typeof turnGameReducer>[1][]
) {
  return actions.reduce(turnGameReducer, state);
}

describe('turnGameReducer', () => {
  it('acertar al primer intento avanza el turno y suma', () => {
    const state = play(createTurnGame([3]), right);
    expect(state.turn).toBe(1);
    expect(state.phase).toBe('asking');
    expect(state.firstTryCorrect).toBe(1);
  });

  it('equivocarse no castiga: muestra la pista y deja intentar', () => {
    const hinted = play(createTurnGame([2]), wrong);
    expect(hinted.phase).toBe('hinted');
    expect(hinted.turn).toBe(0);

    // Puede equivocarse otra vez: nada se resta ni se bloquea.
    const again = play(hinted, wrong);
    expect(again.phase).toBe('hinted');

    const solvedTurn = play(again, right);
    expect(solvedTurn.turn).toBe(1);
    expect(solvedTurn.phase).toBe('asking');
    // Lo resolvió con la pista: no cuenta como primer intento.
    expect(solvedTurn.firstTryCorrect).toBe(0);
  });

  it('la ronda se resuelve al completar todos sus turnos', () => {
    const state = play(createTurnGame([2, 1]), right, right);
    expect(state.phase).toBe('solved');
    // Ya resuelta, otra respuesta no cambia nada.
    expect(turnGameReducer(state, wrong)).toBe(state);
  });

  it('«Siguiente» solo avanza con la ronda resuelta', () => {
    const start = createTurnGame([1, 1]);
    expect(turnGameReducer(start, next)).toBe(start);

    const second = play(start, right, next);
    expect(second.round).toBe(1);
    expect(second.turn).toBe(0);
    expect(second.phase).toBe('asking');
    expect(isLastRound(second)).toBe(true);
  });

  it('después de la última ronda, el juego termina', () => {
    const state = play(
      createTurnGame([1, 2]),
      right,
      next,
      right,
      wrong,
      right,
      next,
    );
    expect(state.finished).toBe(true);
    expect(state.firstTryCorrect).toBe(2);
    expect(totalTurns(state)).toBe(3);
  });
});
