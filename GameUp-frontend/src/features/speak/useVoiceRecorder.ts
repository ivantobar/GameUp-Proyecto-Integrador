import { useCallback, useState } from 'react';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

export type RecorderStatus = 'idle' | 'recording' | 'denied';

/** Rango de volumen que se muestra en la onda (decibeles). */
const SILENCE_DB = -60;

/** Convierte el volumen del micrófono (dB, de -160 a 0) a un valor de 0 a 1. */
function normalizeLevel(metering: number | undefined): number | undefined {
  if (metering === undefined) return undefined;
  const clamped = Math.min(Math.max(metering, SILENCE_DB), 0);
  return (clamped - SILENCE_DB) / -SILENCE_DB;
}

/**
 * Graba la voz con expo-audio. Solo se usa cuando el acudiente autorizó la
 * grabación: la pantalla «Dilo» no lo llama sin consentimiento.
 *
 * El archivo queda en la caché del teléfono; con la API real se enviará al
 * docente autorizado y se podrá eliminar después de la validación.
 */
export function useVoiceRecorder() {
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(recorder, 100);
  const [status, setStatus] = useState<RecorderStatus>('idle');

  const start = useCallback(async (): Promise<boolean> => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setStatus('denied');
      return false;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setStatus('recording');
    return true;
  }, [recorder]);

  /** Detiene la grabación y devuelve la ubicación del archivo. */
  const stop = useCallback(async (): Promise<string | null> => {
    if (!recorder.isRecording) return recorder.uri;
    await recorder.stop();
    // Sin esto, en iPhone el sonido siguiente saldría por el auricular.
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });
    setStatus('idle');
    return recorder.uri;
  }, [recorder]);

  return {
    status,
    level: normalizeLevel(recorderState.metering),
    start,
    stop,
  };
}
