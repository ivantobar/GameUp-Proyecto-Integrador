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
 * Lógica del paso «Dilo»: consentimiento, grabación (si hay autorización) y
 * cierre del ciclo. La pantalla solo pinta y navega con `onDone`.
 */
export function useSayStep(
  vowel: Vowel,
  onDone: (outcome: PracticeOutcome) => void,
) {
  const repositories = useRepositories();
  const { students, consent } = repositories;
  const recorder = useVoiceRecorder();
  const [phase, setPhase] = useState<SayPhase>('ready');
  const finishing = useRef(false);

  const loadConsent = useCallback(async () => {
    const student = await students.getCurrentStudent();
    return consent.hasVoiceRecordingConsent(student.id);
  }, [students, consent]);
  const { resource: consentResource } = useResource(loadConsent);
  const voiceConsent =
    consentResource.status === 'ready' ? consentResource.data : false;

  const finish = useCallback(async () => {
    if (finishing.current) return;
    finishing.current = true;
    setPhase('saving');
    try {
      const audioUri = voiceConsent ? await recorder.stop() : null;
      const outcome = await completePractice(repositories, vowel, audioUri);
      onDone(outcome);
    } catch (error) {
      console.warn('[GameUP] No se pudo guardar el intento', error);
      setPhase('error');
    } finally {
      finishing.current = false;
    }
  }, [voiceConsent, recorder, repositories, vowel, onDone]);

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
    /** Graba solo si hay autorización y el teléfono dio permiso. */
    canRecord: voiceConsent && recorder.status !== 'denied',
    phase,
    level: recorder.level,
    toggleRecording,
    finish,
  };
}
