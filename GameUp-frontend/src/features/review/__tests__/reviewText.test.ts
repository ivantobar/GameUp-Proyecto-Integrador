import type { ReviewItem } from '@/data/types';
import { formatSubmittedAt } from '../formatTime';
import { matchesFilter, pendingTitle, reviewSummary } from '../reviewText';

const now = new Date(2026, 9, 22, 18, 0);

const speech: ReviewItem = {
  id: 'r1',
  kind: 'speech',
  student: { id: 's1', displayName: 'Martín C.', initials: 'MC' },
  submittedAt: new Date(2026, 9, 22, 16, 10).toISOString(),
  status: 'pending_validation',
  speech: {
    vowel: 'o',
    audioUri: null,
    voiceConsent: true,
    attemptNumber: 2,
    attemptsTotal: 2,
  },
};

const listening: ReviewItem = {
  id: 'r2',
  kind: 'listening',
  student: { id: 's3', displayName: 'Samuel O.', initials: 'SO' },
  submittedAt: new Date(2026, 9, 21, 9, 5).toISOString(),
  status: 'pending_validation',
  listening: { firstTryCorrect: 4, total: 5 },
};

describe('textos de «Por escuchar»', () => {
  it('fecha: hoy con hora, ayer, o día y mes', () => {
    expect(formatSubmittedAt(speech.submittedAt, now)).toBe('hoy, 4:10 p. m.');
    expect(
      formatSubmittedAt(new Date(2026, 9, 22, 0, 5).toISOString(), now),
    ).toBe('hoy, 12:05 a. m.');
    expect(formatSubmittedAt(listening.submittedAt, now)).toBe('ayer');
    expect(formatSubmittedAt(new Date(2026, 9, 12).toISOString(), now)).toBe(
      '12 oct.',
    );
  });

  it('resumen como en el mockup', () => {
    expect(reviewSummary(speech, now)).toBe(
      'Habla conmigo · Sonido O · hoy, 4:10 p. m.',
    );
    expect(reviewSummary(listening, now)).toBe('Busca la boca · 4 de 5 · ayer');
  });

  it('título con singular, plural y lista vacía', () => {
    expect(pendingTitle(3)).toBe('3 actividades nuevas');
    expect(pendingTitle(1)).toBe('1 actividad nueva');
    expect(pendingTitle(0)).toBe('Todo revisado');
  });

  it('filtros por juego', () => {
    expect(matchesFilter(speech, 'all')).toBe(true);
    expect(matchesFilter(speech, 'speech')).toBe(true);
    expect(matchesFilter(speech, 'listening')).toBe(false);
    expect(matchesFilter(listening, 'listening')).toBe(true);
  });
});
