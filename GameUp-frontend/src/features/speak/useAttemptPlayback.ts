import { useCallback } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useNarration } from '@/features/narration/useNarration';
import type { Vowel } from '@/data/types';

/**
 * Audios del paso «Listo»:
 * - «Así suena»: el modelo. Por ahora, la voz del teléfono; luego, la
 *   grabación de la terapeuta.
 * - «Así lo dijiste tú»: la grabación del niño, si existe.
 */
export function useAttemptPlayback(vowel: Vowel, audioUri: string | null) {
  const { narrate } = useNarration();
  const player = useAudioPlayer(audioUri ? { uri: audioUri } : null);
  const status = useAudioPlayerStatus(player);

  const playModel = useCallback(() => narrate(vowel), [narrate, vowel]);

  const playAttempt = useCallback(() => {
    if (!audioUri) return;
    player
      .seekTo(0)
      .then(() => player.play())
      .catch(() => {});
  }, [player, audioUri]);

  return { playModel, playAttempt, attemptPlaying: status.playing };
}
