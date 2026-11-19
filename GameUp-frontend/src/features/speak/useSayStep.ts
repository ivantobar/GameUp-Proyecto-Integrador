import { useCallback, useEffect, useRef, useState } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import type { Vowel } from '@/data/types';
import { completePractice, type PracticeOutcome } from './completePractice';
import { useVoiceRecorder } from './useVoiceRecorder';

/**
 * Tope de una grabación. No es un límite de tiempo del juego: al llegar,
 * la grabación se cierra sola y se celebra igual (sin mensaje de error).
 * Evita guardar más voz de la necesaria.
 */
const MAX_RECORDING_MS = 10_000;

export type SayPhase = 'ready' | 'recording' | 'saving' | 'error';

/**
 * Lógica del paso «Dilo»: consentimiento, grabación (si hay autorización y
 * viene de una tarea) y cierre del ciclo. La pantalla solo pinta y navega
 * con `onDone`.
 *
 * Archivo de voz: al terminar pasa a «Listo», que lo borra al salir. Si se
 * sale de «Dilo» sin terminar, se borra aquí.
 */
export function useSayStep(
  vowel: Vowel,
  onDone: (outcome: PracticeOutcome) => void,
  /** Actividad asignada de la que viene, o `null` si es práctica libre. */
  activityId: string | null = null,
) {
  const repositories = useRepositories();
  const { students, consent } = repositories;
  const recorder = useVoiceRecorder();
  const [phase, setPhase] = useState<SayPhase>('ready');
  const finishing = useRef(false);
  /** La grabación ya pasó a «Listo»: «Dilo» no la borra. */
  const handedOff = useRef(false);
  // En práctica libre la voz no se envía a nadie: no se graba (Ley 1581).
  const fromTask = activityId !== null;

  const loadConsent = useCallback(async () => {
    const student = await students.getCurrentStudent();
    return consent.hasVoiceRecordingConsent(student.id);
  }, [students, consent]);
  const { resource: consentResource } = useResource(loadConsent);
  const voiceConsent =
    consentResource.status === 'ready' ? consentResource.data : false;
  const mayRecord = fromTask && voiceConsent;

  // Al salir de «Dilo» sin terminar (atrás, ✕), la grabación se borra.
  const { discard } = recorder;
  useEffect(
    () => () => {
      if (!handedOff.current) discard();
    },
    [discard],
  );

  const finish = useCallback(async () => {
    // Ya terminó (por ejemplo, el tope de grabación llegó justo después):
    // no se envía dos veces.
    if (finishing.current || handedOff.current) return;
    finishing.current = true;
    setPhase('saving');
    try {
      const audioUri = mayRecord ? await recorder.stop() : null;
      const outcome = await completePractice(
        repositories,
        vowel,
        audioUri,
        activityId,
      );
      handedOff.current = true;
      onDone(outcome);
    } catch (error) {
      console.warn(
        '[GameUP] No se pudo guardar el intento',
        error instanceof Error ? error.name : 'Error',
      );
      setPhase('error');
    } finally {
      finishing.current = false;
    }
  }, [mayRecord, recorder, repositories, vowel, activityId, onDone]);

  /** Toque en el micrófono: empieza a grabar, o termina si ya graba. */
  const toggleRecording = useCallback(async () => {
    if (phase === 'recording') {
      await finish();
      return;
    }
    const started = await recorder.start();
    // Si el teléfono no dio permiso de micrófono, se sigue sin grabar.
    if (started) setPhase('recording');
  }, [phase, finish, recorder]);

  useEffect(() => {
    if (phase !== 'recording') return;
    const id = setTimeout(() => {
      finish().catch(() => {});
    }, MAX_RECORDING_MS);
    return () => clearTimeout(id);
  }, [phase, finish]);

  return {
    consentLoading: consentResource.status === 'loading',
    /**
     * Graba solo desde una tarea, con autorización del acudiente y permiso
     * del teléfono. Si no, «Ya lo dije».
     */
    canRecord: mayRecord && recorder.status !== 'denied',
    phase,
    level: recorder.level,
    toggleRecording,
    finish,
  };
}
