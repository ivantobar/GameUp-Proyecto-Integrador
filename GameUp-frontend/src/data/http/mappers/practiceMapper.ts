import {
  isVowel,
  MAX_STARS,
  VOWELS,
  type ResumePoint,
  type StarCount,
  type Vowel,
  type VowelPractice,
} from '../../types';
import type { PracticaVocalDto, PuntoRetornoDto } from '../dto/intentos';
import { requireList } from './responseShape';

/** Estrellas de práctica entre 0 y 3 (no son una nota). */
export function toStarCount(value: unknown): StarCount {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(MAX_STARS, Math.floor(n))) as StarCount;
}

/**
 * Estrellas por vocal, siempre las cinco y en orden (a, e, i, o, u), como
 * los datos simulados. Una vocal que no venga queda en 0.
 */
export function toVowelPractice(dto: PracticaVocalDto[]): VowelPractice[] {
  const stars = new Map<Vowel, StarCount>();
  requireList(dto, 'practica-vocales').forEach((item) => {
    const { vocal, estrellas } = item as PracticaVocalDto;
    if (typeof vocal === 'string' && isVowel(vocal)) {
      stars.set(vocal, toStarCount(estrellas));
    }
  });
  return VOWELS.map((vowel) => ({ vowel, stars: stars.get(vowel) ?? 0 }));
}

/** «Sigue donde ibas»: hoy solo existe para Habla conmigo. */
export function toResumePoint(dto: PuntoRetornoDto): ResumePoint | null {
  const point = dto.puntoRetorno;
  if (!point || typeof point.vocal !== 'string' || !isVowel(point.vocal)) {
    return null;
  }
  return { gameId: 'speak', vowel: point.vocal };
}
