import { findGame } from '@/features/games/catalog';
import type { ReviewItem, ReviewKind } from '@/data/types';
import { formatSubmittedAt } from './formatTime';

export type ReviewFilter = 'all' | ReviewKind;

export const reviewFilters: readonly { value: ReviewFilter; label: string }[] =
  [
    { value: 'all', label: 'Todas' },
    { value: 'speech', label: findGame('speak').title },
    { value: 'listening', label: findGame('findMouth').title },
    { value: 'game', label: 'Pensar y recordar' },
  ];

export function matchesFilter(item: ReviewItem, filter: ReviewFilter): boolean {
  return filter === 'all' || item.kind === filter;
}

/** «Habla conmigo · Sonido O · hoy, 4:10 p. m.» */
export function reviewSummary(item: ReviewItem, now?: Date): string {
  const when = formatSubmittedAt(item.submittedAt, now);
  if (item.kind === 'speech' && item.speech) {
    return `${findGame('speak').title} · Sonido ${item.speech.vowel.toUpperCase()} · ${when}`;
  }
  if (item.kind === 'listening' && item.listening) {
    return `${findGame('findMouth').title} · ${item.listening.firstTryCorrect} de ${item.listening.total} · ${when}`;
  }
  if (item.kind === 'game' && item.game) {
    return `${findGame(item.game.gameId).title} · ${when}`;
  }
  return when;
}

/** «3 actividades nuevas» / «1 actividad nueva». */
export function pendingTitle(count: number): string {
  if (count === 0) return 'Todo revisado';
  return count === 1 ? '1 actividad nueva' : `${count} actividades nuevas`;
}

/** «3 actividades por revisar» / «1 actividad por revisar». */
export function toReviewText(count: number): string {
  return count === 1
    ? '1 actividad por revisar'
    : `${count} actividades por revisar`;
}

/** «2 estudiantes esperan» / «1 estudiante espera». */
export function waitingStudentsTitle(count: number): string {
  if (count === 0) return 'Todo revisado';
  return count === 1 ? '1 estudiante espera' : `${count} estudiantes esperan`;
}

/**
 * Frases rápidas para «Practicar más». PROPUESTA: deben revisarlas las
 * terapeutas de la fundación. El docente siempre puede escribir la suya.
 */
export const feedbackSuggestions = [
  'Practiquemos otra vez mirándote en el espejo.',
  'Hazlo más despacio, abriendo bien la boca.',
  'Mira otra vez el gesto antes de decirlo.',
] as const;
