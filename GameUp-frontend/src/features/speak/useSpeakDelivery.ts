import { useCallback, useEffect, useRef, useState } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import type { Vowel } from '@/data/types';
import { deleteRecording } from '@/features/audio/recordingFiles';
import { deliveryOf, type Delivery } from '@/features/games/delivery';
import type { PracticeOutcome } from './completePractice';

/** Para el adulto, cuando la voz no llegó a la profe. */
export const SPEAK_NOT_SENT_ADULT_TEXT =
  'Para el adulto: no pudimos enviar la voz a la profe. Revisen la conexión y toquen «Reintentar envío».';

/** Para el adulto, si el reintento tampoco funcionó. */
export const SPEAK_RETRY_FAILED_TEXT =
  'Para el adulto: todavía no se pudo enviar. Revisen la conexión e inténtenlo otra vez.';

/** Para el adulto, cuando el reintento sí llegó. */
export const SPEAK_RETRY_SENT_TEXT = 'Listo: la voz ya le llegó a la profe.';

/**
 * - `idle`: no se ha reintentado;
 * - `sending`: reintentando;
 * - `failed`: el reintento tampoco llegó;
 * - `sent`: el reintento llegó.
 */
export type RetryState = 'idle' | 'sending' | 'failed' | 'sent';

/**
 * Envío de la voz en «Listo»:
 * - si no llegó a la profe, el adulto puede «Reintentar envío»;
 * - al salir de «Listo» (o si cambia el intento), la grabación se borra del
 *   teléfono, se haya enviado o no (Ley 1581). Si en ese momento un
 *   reintento la está subiendo, se borra cuando el envío termina.
 */
export function useSpeakDelivery(
  outcome: PracticeOutcome | null,
  vowel: Vowel,
  activityId: string | null,
) {
  const { recordings } = useRepositories();
  // El resultado sirve solo si es de esta vocal.
  const current = outcome?.vowel === vowel ? outcome : null;
  const audioUri = current?.attempt.audioUri ?? null;
  const [delivery, setDelivery] = useState<Delivery>(
    current?.delivery ?? 'review',
  );
  const [retry, setRetry] = useState<RetryState>('idle');
  /** Reintento en curso: el archivo no se puede borrar hasta que termine. */
  const inFlight = useRef<Promise<unknown> | null>(null);

  /**
   * Borra la voz cuando ya no se usa. Si un reintento la está subiendo, espera
   * a que termine (bien o mal): borrarla antes cortaría el envío.
   */
  const deleteWhenIdle = useCallback((uri: string | null) => {
    const pending = inFlight.current;
    if (!pending) {
      deleteRecording(uri);
      return;
    }
    pending.then(
      () => deleteRecording(uri),
      () => deleteRecording(uri),
    );
  }, []);

  // Al salir de «Listo», la voz se borra del teléfono.
  useEffect(() => () => deleteWhenIdle(audioUri), [audioUri, deleteWhenIdle]);

  const retrySend = useCallback(async () => {
    if (!current || !activityId || inFlight.current) return;
    setRetry('sending');
    const send = recordings.submitSpeechAttempt({
      studentId: current.attempt.studentId,
      vowel,
      audioUri,
      activityId,
    });
    inFlight.current = send;
    try {
      const attempt = await send;
      setDelivery(deliveryOf(attempt));
      setRetry('sent');
    } catch (error) {
      // Sin datos del niño en el registro: solo el tipo de error.
      console.warn(
        '[GameUP] No se pudo reenviar el intento de voz',
        error instanceof Error ? error.name : 'Error',
      );
      setRetry('failed');
    } finally {
      inFlight.current = null;
    }
  }, [current, activityId, recordings, vowel, audioUri]);

  return { audioUri, delivery, retry, retrySend };
}
