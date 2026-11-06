import { useCallback, useEffect, useState } from 'react';
import type { GameLevel, LevelUp } from '@/data/types';
import {
  levelUpsSince,
  seenLevelStore,
  toSeenLevels,
  type SeenLevelStore,
} from './levelCelebration';

/**
 * Al abrir «Juegos»: si un juego subió de nivel desde la última vez (la
 * profe aprobó), se celebra una vez. Lo visto se guarda en el teléfono.
 */
export function useLevelCelebration(
  studentId: string | null,
  levels: readonly GameLevel[] | null,
  store: SeenLevelStore = seenLevelStore,
) {
  const [queue, setQueue] = useState<LevelUp[]>([]);

  useEffect(() => {
    if (!studentId || !levels || levels.length === 0) return undefined;
    let active = true;
    (async () => {
      const seen = await store.get(studentId);
      const ups = levelUpsSince(seen, levels);
      await store.set(studentId, toSeenLevels(levels));
      if (active && ups.length > 0) setQueue((q) => [...q, ...ups]);
    })().catch(() => {
      // Sin celebración: nunca un error para el niño.
    });
    return () => {
      active = false;
    };
  }, [studentId, levels, store]);

  const close = useCallback(() => setQueue((q) => q.slice(1)), []);

  return { levelUp: queue[0] ?? null, close };
}
