import { useCallback, useEffect, useRef, useState } from 'react';
import { useClipPlayer } from '@/features/audio/useClipPlayer';

export type RemoteRecordingState = 'idle' | 'loading' | 'error';

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
      setState('error');
    }
  }, [uri, load, playClip]);

  return { play, playing: clip.playing, state, listened };
}
