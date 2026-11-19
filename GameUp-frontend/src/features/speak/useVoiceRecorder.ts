import { useCallback, useRef, useState } from 'react';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  type RecordingOptions,
} from 'expo-audio';
import {
  deleteRecording,
  newRecordingName,
} from '@/features/audio/recordingFiles';

export type RecorderStatus = 'idle' | 'recording' | 'denied';

/**
 * Cómo se graba la voz: el preset oficial `HIGH_QUALITY` de expo-audio
 * (m4a con AAC en iPhone y en Android, lo que acepta el backend) con el
 * medidor de volumen para la onda.
 *
 * Se usa al crear la grabadora Y en cada `prepareToRecordAsync`: las opciones
 * que recibe `prepareToRecordAsync` REEMPLAZAN por completo a las de la
 * grabadora (no se combinan). Pasarle solo `{ fileName }` grababa en iPhone
 * un archivo sin formato ni extensión, que no sonaba ni se podía subir.
 */
export const VOICE_RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

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
 * Cada grabación es un archivo nuevo en la caché, con el prefijo de GameUP
 * (`recordingFiles.ts`). Quien la usa decide cuándo borrarla; `discard`
 * borra la última si ya no se va a usar.
 */
export function useVoiceRecorder() {
  const recorder = useAudioRecorder(VOICE_RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 100);
  const [status, setStatus] = useState<RecorderStatus>('idle');
  /** Archivo de la última grabación (para poder descartarla). */
  const lastUri = useRef<string | null>(null);

  const start = useCallback(async (): Promise<boolean> => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setStatus('denied');
      return false;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    // Grabar otra vez reemplaza la toma anterior: esa ya no se usa.
    deleteRecording(lastUri.current);
    // Nombre propio en cada grabación: no se pisa la anterior y se puede
    // borrar solo lo de GameUP. Siempre con las opciones completas (ver
    // VOICE_RECORDING_OPTIONS): si no, se pierden el formato y la extensión.
    await recorder.prepareToRecordAsync({
      ...VOICE_RECORDING_OPTIONS,
      fileName: newRecordingName(),
    });
    lastUri.current = recorder.uri;
    recorder.record();
    setStatus('recording');
    return true;
  }, [recorder]);

  /** Borra la última grabación (por ejemplo, si se sale sin terminar). */
  const discard = useCallback(() => {
    deleteRecording(lastUri.current);
    lastUri.current = null;
  }, []);

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
    lastUri.current = recorder.uri;
    return recorder.uri;
  }, [recorder]);

  return {
    status,
    level: normalizeLevel(recorderState.metering),
    start,
    stop,
    discard,
  };
}
