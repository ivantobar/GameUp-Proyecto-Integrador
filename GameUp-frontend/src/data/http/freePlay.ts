import type {
  ListeningResult,
  NewListeningResult,
  NewSpeechAttempt,
  SpeechAttempt,
} from '../types';

/**
 * Juego abierto libre (sin actividad) con la API: se practica, pero no se
 * envía al docente ni suma estrellas (decisión D1). Se devuelve el mismo
 * tipo que un envío real, marcado con `sentForReview: false`.
 */
const localId = (prefix: string) => `${prefix}-${Date.now()}`;

export function freePlaySpeechAttempt(input: NewSpeechAttempt): SpeechAttempt {
  return {
    id: localId('practica-voz'),
    studentId: input.studentId,
    vowel: input.vowel,
    audioUri: input.audioUri,
    status: 'submitted',
    createdAt: new Date().toISOString(),
    sentForReview: false,
  };
}

export function freePlayListeningResult(
  input: NewListeningResult,
): ListeningResult {
  return {
    id: localId('practica-boca'),
    studentId: input.studentId,
    gameId: 'findMouth',
    firstTryCorrect: input.firstTryCorrect,
    total: input.total,
    status: 'submitted',
    createdAt: new Date().toISOString(),
    sentForReview: false,
  };
}
