import type { ActivityContent, LadderGameId, PictureFace } from '../types';

/**
 * Contenido de ejemplo de cada nivel de la escalera (datos simulados y
 * backend falso de las pruebas). Mismo tamaño que exige el backend
 * (`estrategias.ts`): así, sin API, se ven los tableros de cada nivel.
 */

const DIBUJOS: readonly [string, string][] = [
  ['manzana', '🍎'],
  ['perro', '🐶'],
  ['sol', '☀️'],
  ['carro', '🚗'],
  ['pelota', '⚽'],
  ['gato', '🐱'],
  ['flor', '🌸'],
  ['pez', '🐟'],
  ['luna', '🌙'],
];

const cara = (i: number, prefijo: string): PictureFace => {
  const [label, emoji] = DIBUJOS[i % DIBUJOS.length]!;
  return { id: `${prefijo}-${i}`, label, emoji };
};

/** Opciones de Emparejar por nivel; en 4 y 5, la tarjeta de arriba es la palabra. */
const OPCIONES = [2, 3, 4, 3, 4] as const;
/** Grupos y elementos de Clasificar por nivel. */
const CLASIFICAR = [
  [2, 4],
  [2, 6],
  [2, 8],
  [3, 6],
  [3, 9],
] as const;
const GRUPOS: readonly [string, string][] = [
  ['rojo', '🔴'],
  ['azul', '🔵'],
  ['verde', '🟢'],
];

export function ladderActivityId(gameId: LadderGameId, level: number): string {
  return `escalera-${gameId}-${level}`;
}

/** Contenido del nivel `level` (1 a 5) de un juego. */
export function ladderContent(
  gameId: LadderGameId,
  level: number,
): ActivityContent {
  const n = Math.min(5, Math.max(1, Math.trunc(level)));
  const base = {
    activityId: ladderActivityId(gameId, n),
    title: `Nivel ${n}`,
  };
  switch (gameId) {
    case 'memory':
      return {
        ...base,
        gameId,
        boards: [
          {
            id: 'b0',
            pairs: Array.from({ length: n + 1 }, (_, i) => cara(i, 'p')),
          },
        ],
      };
    case 'match': {
      const options = Array.from({ length: OPCIONES[n - 1]! }, (_, i) =>
        cara(i, 'o'),
      );
      const answer = options[0]!;
      return {
        ...base,
        gameId,
        rounds: [
          {
            id: 'r0',
            question: n >= 4 ? '¿Cuál es?' : '¿Cuál es igual?',
            prompt:
              n >= 4
                ? { id: 'e', label: answer.label, text: answer.label }
                : { ...answer, id: 'e' },
            options,
            answerId: answer.id,
          },
        ],
      };
    }
    case 'classify': {
      const [grupos, elementos] = CLASIFICAR[n - 1]!;
      const categories = GRUPOS.slice(0, grupos).map(([label, emoji]) => ({
        id: `g-${label}`,
        label,
        emoji,
      }));
      return {
        ...base,
        gameId,
        sets: [
          {
            id: 's0',
            question: '¿De qué color es?',
            categories,
            items: Array.from({ length: elementos }, (_, i) => ({
              ...cara(i, 'e'),
              categoryId: categories[i % grupos]!.id,
            })),
          },
        ],
      };
    }
    case 'sequence':
      return {
        ...base,
        gameId,
        routines: [
          {
            id: 'rt0',
            title: 'Paso a paso',
            steps: Array.from({ length: n + 1 }, (_, i) => cara(i, 'paso')),
          },
        ],
      };
  }
}
