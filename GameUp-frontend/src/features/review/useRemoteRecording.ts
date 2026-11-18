import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RecordingConsentWithdrawnError,
  RecordingUnavailableError,
} from '@/data/reviewErrors';
import { useClipPlayer } from '@/features/audio/useClipPlayer';

/**
 * - `error`: no hubo respuesta (conexión) u otro problema: se toca otra vez.
 * - `withdrawn`: el acudiente retiró la autorización (403 del backend). No
 *   se puede oír; reintentar no sirve.
 * - `unavailable`: el servidor no pudo traerlo ahora (503: ASISCO UP o
 *   Storage). Se ofrece «Reintentar».
 */
export type RemoteRecordingState =
  'idle' | 'loading' | 'error' | 'withdrawn' | 'unavailable';

function stateFor(error: unknown): RemoteRecordingState {
  if (error instanceof RecordingConsentWithdrawnError) return 'withdrawn';
  if (error instanceof RecordingUnavailableError) return 'unavailable';
  return 'error';
}

/**
 * Grabación de un intento que está en el servidor: al tocar «Escuchar» se
 * pide su URL (firmada, de pocos minutos) y se reproduce. Pedirla es lo que
 * el backend exige antes de validar ese intento: `listened` lo indica.
 */
export function useRemoteRecording(load?: () => Promise<string>) {
  const [uri, setUri] = useState<string | null>(null);
  const [state, setState] = useState<RemoteRecordingState>('idle');
  const [listened, setListened] = useState(false);
  const clip = useClipPlayer(uri);
  const playWhenReady = useRef(false);
  const { play: playClip } = clip;

  // El reproductor se crea con la URL: se reproduce cuando ya la tiene.
  useEffect(() => {
    if (uri && playWhenReady.current) {
      playWhenReady.current = false;
      playClip();
    }
  }, [uri, playClip]);

  const play = useCallback(async () => {
    if (uri) {
      playClip();
      return;
    }
    if (!load) return;
    setState('loading');
    try {
      const url = await load();
      playWhenReady.current = true;
      setUri(url);
      setListened(true);
      setState('idle');
    } catch (error) {
      console.warn(
        '[GameUP] No se pudo traer la grabación',
        error instanceof Error ? error.name : 'Error',
      );
      setState(stateFor(error));
    }
  }, [uri, load, playClip]);

  // Reintentar es volver a pedir la URL (aún no hay ninguna guardada).
  return { play, retry: play, playing: clip.playing, state, listened };
}
