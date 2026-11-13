import { LADDER_LEVELS, type GameLevel, type LadderGameId } from '@/data/types';
import { LevelChangeError, StudentAccessError } from '@/data/studentErrors';
import { findGame } from '@/features/games/catalog';

/** Largo máximo del motivo (igual que el backend). */
export const MAX_REASON_LENGTH = 300;

/**
 * Niveles que se pueden elegir a mano:
 * - la directora: todos menos el actual (si el juego está completado,
 *   también el actual, para volver a abrirlo);
 * - la tallerista: solo niveles menores (o volver a abrir un juego
 *   completado en su nivel). Subir es aprobar un intento del nivel actual.
 */
export function allowedLevels(level: GameLevel, canRaise: boolean): number[] {
  const all = Array.from({ length: LADDER_LEVELS }, (_, i) => i + 1);
  if (canRaise) {
    return all.filter((n) => n !== level.level || level.completed);
  }
  return all.filter((n) =>
    level.completed ? n <= level.level : n < level.level,
  );
}

/** «Memoria». */
export function gameTitle(gameId: LadderGameId): string {
  return findGame(gameId).title;
}

/** «Memoria quedó en el nivel 2.» (aviso al volver al detalle). */
export function levelChangedText(gameId: LadderGameId, level: number): string {
  return `${gameTitle(gameId)} quedó en el nivel ${level}.`;
}

/**
 * Mensaje para la pantalla. Si el backend dijo por qué (403 de la
 * tallerista que intenta subir, motivo vacío…), se muestra su mensaje.
 */
export function levelChangeErrorText(error: unknown): string {
  if (error instanceof LevelChangeError) {
    if (error.detail) return error.detail;
    switch (error.problem) {
      case 'notAllowed':
        return 'Tu rol no puede cambiar este nivel.';
      case 'changed':
        return 'El nivel cambió mientras tanto. Revisa el nivel actual y vuelve a elegir.';
      case 'invalid':
        return 'Revisa el nivel y el motivo.';
    }
  }
  if (error instanceof StudentAccessError) {
    return 'No puedes cambiar el nivel de este estudiante.';
  }
  return 'No se pudo guardar. Revisa la conexión e inténtalo otra vez.';
}
