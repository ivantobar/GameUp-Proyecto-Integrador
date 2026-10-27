import { useCallback } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

/**
 * Reproduce un audio guardado (una grabación o una nota de voz) desde el
 * principio. Sin `uri`, `play` no hace nada y la pantalla desactiva el botón.
 */
export function useClipPlayer(uri: string | null) {
  const player = useAudioPlayer(uri ? { uri } : null);
  const status = useAudioPlayerStatus(player);

  const play = useCallback(() => {
    if (!uri) return;
    player
      .seekTo(0)
      .then(() => player.play())
      .catch(() => {});
  }, [player, uri]);

  return { play, playing: status.playing, available: uri !== null };
}
