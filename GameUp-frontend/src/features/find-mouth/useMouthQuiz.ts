import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import type { Vowel } from '@/data/types';
import { deliveryOf, type Delivery } from '@/features/games/delivery';
import { useNarration } from '@/features/narration/useNarration';
import { createQuiz, currentRound, quizReducer } from './mouthQuiz';

export type SubmitPhase = 'idle' | 'saving';

interface MouthQuizOptions {
  /** Vocales del juego: las de la actividad, o las cinco si es libre. */
  vowels: readonly Vowel[];
  /** Actividad asignada de la que viene, o `null` si el juego es libre. */
  activityId: string | null;
  /** Al terminar: qué pasó con el resultado (decide el mensaje final). */
  onFinish: (delivery: Delivery) => void;
}

/**
 * Estado y acciones de «Busca la boca». La pantalla solo pinta.
 * - Al empezar cada ronda, el sonido se oye solo una vez; luego el niño
 *   puede volver a oírlo cuantas veces quiera.
 * - Al terminar, envía el resultado para que el docente lo revise. Si no se
 *   puede (ni reintentándolo en silencio), se celebra igual: el niño no ve
 *   un error (Regla 11) y la pantalla final avisa al adulto.
 */
export function useMouthQuiz({
  vowels,
  activityId,
  onFinish,
}: MouthQuizOptions) {
  const { students, results } = useRepositories();
  const { narrate } = useNarration();
  const [state, dispatch] = useReducer(quizReducer, vowels, (initial) =>
    createQuiz(Math.random, initial),
  );
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>('idle');
  const submitted = useRef(false);
  const round = currentRound(state);
  const target = round?.target;

  const playSound = useCallback(() => {
    if (target) narrate(target);
  }, [narrate, target]);

  // Cada ronda nueva empieza oyendo su sonido.
  useEffect(() => {
    playSound();
  }, [playSound]);

  const choose = useCallback((vowel: Vowel) => {
    dispatch({ type: 'choose', vowel });
  }, []);

  const submit = useCallback(async () => {
    if (submitted.current) return;
    submitted.current = true;
    setSubmitPhase('saving');
    try {
      const student = await students.getCurrentStudent();
      const result = await results.submitFindMouthResult({
        studentId: student.id,
        firstTryCorrect: state.firstTryCorrect,
        total: state.rounds.length,
        activityId,
      });
      onFinish(deliveryOf(result));
    } catch (error) {
      // Sin datos del niño en el registro: solo el tipo de error.
      console.warn(
        '[GameUP] No se pudo enviar Busca la boca',
        error instanceof Error ? error.name : 'Error',
      );
      onFinish(activityId ? 'notSent' : 'practice');
    }
  }, [
    students,
    results,
    state.firstTryCorrect,
    state.rounds.length,
    activityId,
    onFinish,
  ]);

  const isLastRound = state.index >= state.rounds.length - 1;

  /** «Siguiente»; en la última ronda, termina y envía el resultado. */
  const next = useCallback(() => {
    if (state.phase !== 'solved') return;
    dispatch({ type: 'next' });
    if (isLastRound) {
      // El conteo ya es definitivo: se suma al resolver cada ronda.
      submit().catch(() => {});
    }
  }, [state.phase, isLastRound, submit]);

  return {
    round,
    index: state.index,
    total: state.rounds.length,
    phase: state.phase,
    finished: state.finished,
    submitPhase,
    playSound,
    choose,
    next,
  };
}
