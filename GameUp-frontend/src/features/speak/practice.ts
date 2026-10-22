import { MAX_STARS, type StarCount, type VowelPractice } from '@/data/types';

/**
 * Nivel de práctica de una vocal, según las estrellas de práctica.
 * Regla acordada: cada ciclo Mira → Dilo → Listo suma 1 estrella, hasta 3.
 * No es progreso oficial: ese solo lo da la validación del docente.
 */
export type PracticeLevel = 'notPracticed' | 'inProgress' | 'practiced';

export function practiceLevel(stars: StarCount): PracticeLevel {
  if (stars === 0) return 'notPracticed';
  if (stars < MAX_STARS) return 'inProgress';
  return 'practiced';
}

export const practiceLevelLabels: Record<PracticeLevel, string> = {
  notPracticed: 'Sin practicar',
  inProgress: 'En curso',
  practiced: 'Practicada',
};

/** Vocales con las 3 estrellas («Llevas 3 de 5 vocales»). */
export function countPracticed(practice: readonly VowelPractice[]): number {
  return practice.filter((item) => practiceLevel(item.stars) === 'practiced')
    .length;
}
