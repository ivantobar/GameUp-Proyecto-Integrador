import * as SecureStore from 'expo-secure-store';
import type { GameLevel, LadderGameId, LevelUp } from '@/data/types';

/** Último nivel que vio el niño en cada juego (en su teléfono). */
export type SeenLevels = Partial<
  Record<LadderGameId, { level: number; completed: boolean }>
>;

/**
 * ¿Qué juegos subieron de nivel (o se completaron) desde la última vez que
 * el niño abrió «Juegos»? La primera vez no hay nada que celebrar: solo se
 * guarda lo que ve.
 */
export function levelUpsSince(
  seen: SeenLevels | null,
  current: readonly GameLevel[],
): LevelUp[] {
  if (!seen) return [];
  const ups: LevelUp[] = [];
  for (const now of current) {
    const before = seen[now.gameId];
    if (!before) continue;
    if (now.level > before.level || (now.completed && !before.completed)) {
      ups.push({
        gameId: now.gameId,
        previousLevel: before.level,
        level: now.level,
        completed: now.completed,
      });
    }
  }
  return ups;
}

export function toSeenLevels(levels: readonly GameLevel[]): SeenLevels {
  const seen: SeenLevels = {};
  for (const l of levels) {
    seen[l.gameId] = { level: l.level, completed: l.completed };
  }
  return seen;
}

/** Dónde se recuerda lo visto (inyectable en las pruebas). */
export interface SeenLevelStore {
  get(studentId: string): Promise<SeenLevels | null>;
  set(studentId: string, seen: SeenLevels): Promise<void>;
}

/** Claves de SecureStore: solo letras, números, «.», «-» y «_». */
const keyOf = (studentId: string) =>
  `gameup.niveles-vistos.${studentId.replace(/[^\w.-]/g, '_')}`;

/**
 * En el teléfono (expo-secure-store, ya incluido en la app). Si no se puede
 * leer o escribir, se recuerda solo mientras la app está abierta: en el
 * peor caso, el niño no ve la celebración, nunca un error.
 */
export function createSeenLevelStore(): SeenLevelStore {
  const memory = new Map<string, SeenLevels>();
  return {
    async get(studentId) {
      try {
        const raw = await SecureStore.getItemAsync(keyOf(studentId));
        if (raw) return JSON.parse(raw) as SeenLevels;
      } catch {
        // Sin almacenamiento seguro (o dato dañado): se usa la memoria.
      }
      return memory.get(studentId) ?? null;
    },
    async set(studentId, seen) {
      memory.set(studentId, seen);
      try {
        await SecureStore.setItemAsync(keyOf(studentId), JSON.stringify(seen));
      } catch {
        // Queda en memoria.
      }
    },
  };
}

export const seenLevelStore = createSeenLevelStore();
