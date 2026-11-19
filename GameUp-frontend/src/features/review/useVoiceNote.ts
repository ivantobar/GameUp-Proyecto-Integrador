import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteRecording } from '@/features/audio/recordingFiles';
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

  // La versión más reciente de `stop`, para el tope de la nota.
  const stopRef = useRef(stop);
  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  // Tope de la nota. Depende SOLO de `phase`: mientras graba, el medidor de
  // volumen redibuja cada 100 ms y `stop` cambia en cada dibujo; si el
  // temporizador dependiera de `stop`, se reiniciaría sin llegar al minuto.
  useEffect(() => {
    if (phase !== 'recording') return;
    const id = setTimeout(() => {
      stopRef.current().catch(() => {});
    }, MAX_VOICE_NOTE_MS);
    return () => clearTimeout(id);
  }, [phase]);

  /**
   * Envía la nota con `onSave`. Si se guardó, el archivo se borra del
   * teléfono en ese momento; si no, se conserva para volver a intentarlo.
   */
  const save = useCallback(
    async (onSave: (audioUri: string) => Promise<boolean>) => {
      if (!uri) return false;
      const saved = await onSave(uri);
      if (saved) {
        deleteRecording(uri);
        setUri(null);
        setPhase('idle');
      }
      return saved;
    },
    [uri],
  );

  return {
    phase,
    uri,
    denied: recorder.status === 'denied',
    level: recorder.level,
    start,
    stop,
    save,
  };
}
