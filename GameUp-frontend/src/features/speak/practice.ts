import {
  MAX_STARS,
  type StarCount,
  type Vowel,
  type VowelPractice,
} from '@/data/types';

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

/** Vocales con las 3 estrellas («Vocales terminadas: 3 de 5»). */
export function countPracticed(practice: readonly VowelPractice[]): number {
  return practice.filter((item) => practiceLevel(item.stars) === 'practiced')
    .length;
}

/** Texto visible del medidor: «Vocales terminadas: 2 de 5». */
export function vowelsDoneLabel(done: number, total: number): string {
  return `Vocales terminadas: ${done} de ${total}`;
}

/** «A», «A y E», «A, E e I» (antes de «I» la «y» se vuelve «e»). */
function listLetters(vowels: readonly Vowel[]): string {
  const letters = vowels.map((vowel) => vowel.toUpperCase());
  const last = letters[letters.length - 1];
  if (!last || letters.length === 1) return letters.join('');
  const and = last === 'I' ? 'e' : 'y';
  return `${letters.slice(0, -1).join(', ')} ${and} ${last}`;
}

/**
 * Lo que oye el lector de pantalla del medidor, en un solo elemento:
 * «Vocales terminadas: 2 de 5: A y E».
 */
export function vowelsDoneAccessibilityLabel(
  practice: readonly VowelPractice[],
): string {
  const done = practice
    .filter((item) => practiceLevel(item.stars) === 'practiced')
    .map((item) => item.vowel);
  const label = vowelsDoneLabel(done.length, practice.length);
  return done.length > 0 ? `${label}: ${listLetters(done)}` : label;
}

/** Narración de «Habla conmigo»: qué hacer y cuándo se termina una vocal. */
export function speakSelectionNarration(done: number, total: number): string {
  const intro =
    'Toca un sonido para practicar. Cada vocal se termina con 3 estrellas.';
  if (done === 0) return `${intro} Todavía no terminas ninguna.`;
  if (done >= total) return `${intro} ¡Terminaste las ${total} vocales!`;
  return `${intro} Ya terminaste ${done} de ${total}.`;
}
