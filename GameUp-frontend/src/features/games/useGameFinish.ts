import { useCallback, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useRepositories } from '@/data/RepositoryProvider';
import type { GameScore, ThinkingGameId } from '@/data/types';
import { deliveryOf, type Delivery } from './delivery';

/** Pantalla final de cada juego de «Pensar y recordar». */
const DONE_PATH = {
  match: '/student/match/done',
  classify: '/student/classify/done',
  sequence: '/student/sequence/done',
  memory: '/student/memory/done',
} as const satisfies Record<ThinkingGameId, string>;

/**
 * Cierre de Emparejar, Clasificar, Secuenciar y Memoria: envía el resultado
 * (si el juego viene de una tarea) y va a la pantalla final, que dice si
 * llegó al docente. Se envía una sola vez aunque se toque «Terminar» de
 * nuevo. Si el envío falla (ya reintentado en silencio), se celebra igual
 * y la pantalla final avisa al adulto (Regla 11).
 */
export function useGameFinish(
  gameId: ThinkingGameId,
  activityId: string | null,
) {
  const { students, results } = useRepositories();
  const [saving, setSaving] = useState(false);
  const finishing = useRef(false);

  const finish = useCallback(
    async (score: GameScore) => {
      if (finishing.current) return;
      finishing.current = true;
      setSaving(true);

      let delivery: Delivery;
      try {
        const student = await students.getCurrentStudent();
        const result = await results.submitGameResult({
          studentId: student.id,
          gameId,
          score,
          activityId,
        });
        delivery = deliveryOf(result);
      } catch (error) {
        // Sin datos del niño en el registro: solo el tipo de error.
        console.warn(
          '[GameUP] No se pudo enviar el juego',
          error instanceof Error ? error.name : 'Error',
        );
        delivery = activityId ? 'notSent' : 'practice';
      }

      router.replace({
        pathname: DONE_PATH[gameId],
        params: activityId
          ? { envio: delivery, actividadId: activityId }
          : { envio: delivery },
      });
    },
    [students, results, gameId, activityId],
  );

  return { saving, finish };
}
