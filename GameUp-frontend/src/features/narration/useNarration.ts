import { useCallback, useEffect } from 'react';
import { expoSpeechNarrator, type Narrator } from './narrator';

/**
 * Lee en voz alta una instrucción. Al salir de la pantalla, la narración se
 * detiene para no hablar encima de la pantalla siguiente.
 */
export function useNarration(narrator: Narrator = expoSpeechNarrator) {
  useEffect(() => () => narrator.stop(), [narrator]);

  const narrate = useCallback(
    (text: string) => narrator.speak(text),
    [narrator],
  );

  return { narrate };
}
