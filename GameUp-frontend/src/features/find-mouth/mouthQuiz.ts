import { VOWELS, type Vowel } from '@/data/types';
import { shuffle, type Random } from '@/features/games/shuffle';

// Se movió a `features/games` porque la usan varios juegos.
export { shuffle };

/**
 * Lógica pura de «Busca la boca» (sin React), para poder probarla sola.
 *
 * Reglas (mockups y decisión del equipo):
 * - Una ronda por vocal; en cada una se oye el sonido y hay 3 bocas.
 * - Sin tiempo límite, sin vidas y sin sonido de error.
 * - Si se equivoca, la boca correcta se ilumina como pista y el niño la
 *   toca; solo entonces se habilita «Siguiente».
 */

export const OPTIONS_PER_ROUND = 3;

export interface QuizRound {
  target: Vowel;
  options: Vowel[];
}

/** Estado de una ronda: preguntando, con pista, o resuelta. */
export type RoundPhase = 'asking' | 'hinted' | 'solved';

export interface QuizState {
  rounds: QuizRound[];
  index: number;
  phase: RoundPhase;
  /** Sonidos reconocidos al primer intento (información para el docente). */
  firstTryCorrect: number;
  finished: boolean;
}

export type QuizAction = { type: 'choose'; vowel: Vowel } | { type: 'next' };

/** Crea las rondas: cada vocal una vez, con 2 bocas distractoras. */
export function buildRounds(
  random: Random = Math.random,
  vowels: readonly Vowel[] = VOWELS,
): QuizRound[] {
  return shuffle(vowels, random).map((target) => {
    const distractors = shuffle(
      vowels.filter((v) => v !== target),
      random,
    ).slice(0, OPTIONS_PER_ROUND - 1);
    return { target, options: shuffle([target, ...distractors], random) };
  });
}

export function createQuiz(random: Random = Math.random): QuizState {
  return {
    rounds: buildRounds(random),
    index: 0,
    phase: 'asking',
    firstTryCorrect: 0,
    finished: false,
  };
}

export function currentRound(state: QuizState): QuizRound | undefined {
  return state.rounds[state.index];
}

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  const round = currentRound(state);
  if (!round || state.finished) return state;

  switch (action.type) {
    case 'choose': {
      if (state.phase === 'solved') return state;
      if (action.vowel === round.target) {
        return {
          ...state,
          phase: 'solved',
          firstTryCorrect:
            state.phase === 'asking'
              ? state.firstTryCorrect + 1
              : state.firstTryCorrect,
        };
      }
      // Equivocarse no resta nada: solo se ilumina la boca correcta.
      return { ...state, phase: 'hinted' };
    }
    case 'next': {
      if (state.phase !== 'solved') return state;
      const isLast = state.index >= state.rounds.length - 1;
      return isLast
        ? { ...state, finished: true }
        : { ...state, index: state.index + 1, phase: 'asking' };
    }
  }
}
