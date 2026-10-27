import { useCallback, useEffect, useState } from 'react';
import { useVoiceRecorder } from '@/features/speak/useVoiceRecorder';

/** Tope de una nota de voz para la familia. */
export const MAX_VOICE_NOTE_MS = 60_000;

export type VoiceNotePhase = 'idle' | 'recording' | 'recorded';

/**
 * Grabar la nota de voz del docente: grabar, detener (o se detiene sola al
 * minuto), escucharla y volver a grabar. Enviarla lo decide la pantalla.
 */
export function useVoiceNote() {
  const recorder = useVoiceRecorder();
  const [phase, setPhase] = useState<VoiceNotePhase>('idle');
  const [uri, setUri] = useState<string | null>(null);

  const stop = useCallback(async () => {
    const result = await recorder.stop();
    setUri(result);
    setPhase(result ? 'recorded' : 'idle');
  }, [recorder]);

  const start = useCallback(async () => {
    setUri(null);
    const started = await recorder.start();
    if (started) setPhase('recording');
  }, [recorder]);

  useEffect(() => {
    if (phase !== 'recording') return;
    const id = setTimeout(() => {
      stop().catch(() => {});
    }, MAX_VOICE_NOTE_MS);
    return () => clearTimeout(id);
  }, [phase, stop]);

  return {
    phase,
    uri,
    denied: recorder.status === 'denied',
    level: recorder.level,
    start,
    stop,
  };
}
