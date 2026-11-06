import {
  LADDER_LEVELS,
  isLadderGame,
  type GameLevel,
  type LadderGameId,
  type LevelUp,
} from '../../types';
import type { NivelJuegoDto, SubidaNivelDto } from '../dto/niveles';
import { toGameId } from './gameCodes';
import { unexpected } from './responseShape';

/** Código del backend → juego con escalera de la app. */
export function toLadderGameId(codigo: unknown, field = 'juego'): LadderGameId {
  const gameId = toGameId(codigo);
  if (!isLadderGame(gameId)) throw unexpected(field);
  return gameId;
}

/** Nivel 1 a 5 (cualquier otro valor es una respuesta inesperada). */
function toLevel(value: unknown, field: string): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > LADDER_LEVELS
  ) {
    throw unexpected(field);
  }
  return value;
}

export function toGameLevel(dto: NivelJuegoDto): GameLevel {
  return {
    gameId: toLadderGameId(dto.juego),
    level: toLevel(dto.nivelActual, 'nivelActual'),
    completed: dto.completado === true,
    pendingReview:
      typeof dto.pendientesValidacion === 'number' &&
      dto.pendientesValidacion > 0
        ? Math.trunc(dto.pendientesValidacion)
        : 0,
  };
}

export function toLevelUp(
  dto: SubidaNivelDto | null | undefined,
): LevelUp | null {
  if (!dto) return null;
  return {
    gameId: toLadderGameId(dto.juego),
    previousLevel: toLevel(dto.nivelAnterior, 'nivelAnterior'),
    level: toLevel(dto.nivelNuevo, 'nivelNuevo'),
    completed: dto.completado === true,
  };
}

/** Juego de la app → código del backend (para la ruta). */
export const CODIGO_DE_JUEGO: Record<LadderGameId, string> = {
  match: 'EMPAREJAR',
  classify: 'CLASIFICAR',
  sequence: 'SECUENCIAR',
  memory: 'MEMORIA',
};
