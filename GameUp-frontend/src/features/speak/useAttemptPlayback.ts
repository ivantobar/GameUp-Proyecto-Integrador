import { useCallback } from 'react';
import { useClipPlayer } from '@/features/audio/useClipPlayer';
import { useNarration } from '@/features/narration/useNarration';
import type { Vowel } from '@/data/types';

/**
 * Audios del paso «Listo» (y de la revisión del docente):
 * - «Así suena» / «Modelo»: por ahora, la voz del teléfono; luego, la
 *   grabación de la terapeuta.
 * - «Así lo dijiste tú»: la grabación del niño, si existe.
 */
export function useAttemptPlayback(vowel: Vowel, audioUri: string | null) {
  const { narrate } = useNarration();
  const attempt = useClipPlayer(audioUri);

  const playModel = useCallback(() => narrate(vowel), [narrate, vowel]);

  return {
    playModel,
    playAttempt: attempt.play,
    attemptPlaying: attempt.playing,
  };
}
