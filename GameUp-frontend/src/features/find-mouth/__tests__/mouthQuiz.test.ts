import { VOWELS } from '@/data/types';
import {
  buildRounds,
  createQuiz,
  currentRound,
  OPTIONS_PER_ROUND,
  quizReducer,
  type QuizState,
} from '../mouthQuiz';

/** Generador pseudoaleatorio repetible, para pruebas estables. */
function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function target(state: QuizState) {
  const round = currentRound(state);
  if (!round) throw new Error('No hay ronda');
  return round;
}

describe('buildRounds', () => {
  it('una ronda por vocal, cada una con 3 bocas distintas que incluyen la correcta', () => {
    const rounds = buildRounds(seeded(1));
    expect(rounds.map((r) => r.target).sort()).toEqual([...VOWELS].sort());
    rounds.forEach((round) => {
      expect(round.options).toHaveLength(OPTIONS_PER_ROUND);
      expect(new Set(round.options).size).toBe(OPTIONS_PER_ROUND);
      expect(round.options).toContain(round.target);
    });
  });
});

describe('quizReducer', () => {
  it('acertar al primer intento resuelve la ronda y suma', () => {
    const start = createQuiz(seeded(2));
    const after = quizReducer(start, {
      type: 'choose',
      vowel: target(start).target,
    });
    expect(after.phase).toBe('solved');
    expect(after.firstTryCorrect).toBe(1);
  });

  it('equivocarse no castiga: solo muestra la pista y deja intentar', () => {
    const start = createQuiz(seeded(3));
    const round = target(start);
    const wrong = round.options.find((v) => v !== round.target);
    if (!wrong) throw new Error('Falta distractor');

    const hinted = quizReducer(start, { type: 'choose', vowel: wrong });
    expect(hinted.phase).toBe('hinted');
    expect(hinted.index).toBe(0);

    const solved = quizReducer(hinted, { type: 'choose', vowel: round.target });
    expect(solved.phase).toBe('solved');
    // Lo resolvió con la pista: no cuenta como primer intento.
    expect(solved.firstTryCorrect).toBe(0);
  });

  it('«Siguiente» solo avanza cuando la ronda está resuelta', () => {
    const start = createQuiz(seeded(4));
    expect(quizReducer(start, { type: 'next' })).toBe(start);

    const solved = quizReducer(start, {
      type: 'choose',
      vowel: target(start).target,
    });
    const next = quizReducer(solved, { type: 'next' });
    expect(next.index).toBe(1);
    expect(next.phase).toBe('asking');
  });

  it('después de la última ronda, el juego termina', () => {
    let state = createQuiz(seeded(5));
    for (let i = 0; i < VOWELS.length; i += 1) {
      state = quizReducer(state, {
        type: 'choose',
        vowel: target(state).target,
      });
      state = quizReducer(state, { type: 'next' });
    }
    expect(state.finished).toBe(true);
    expect(state.firstTryCorrect).toBe(5);
  });
});
