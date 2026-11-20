import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/features/motion/useReducedMotion';
import type { CharacterEyes } from './Character';

/** Espera antes de parpadear y cuánto duran los ojos cerrados. */
const BLINK_AFTER_MS = 900;
const BLINK_MS = 160;

/**
 * El personaje parpadea UNA vez al aparecer (se ve vivo, sin distraer):
 * nada en bucle. Con «reducir movimiento», no parpadea.
 */
export function useBlinkOnce(): CharacterEyes {
  const reduced = useReducedMotion();
  const [eyes, setEyes] = useState<CharacterEyes>('open');

  useEffect(() => {
    if (reduced) return undefined;
    let reopen: ReturnType<typeof setTimeout> | undefined;
    const close = setTimeout(() => {
      setEyes('closed');
      reopen = setTimeout(() => setEyes('open'), BLINK_MS);
    }, BLINK_AFTER_MS);
    return () => {
      clearTimeout(close);
      if (reopen) clearTimeout(reopen);
    };
  }, [reduced]);

  return eyes;
}
