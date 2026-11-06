import type {
  GameResult,
  GameScore,
  ListeningResult,
  NewGameResult,
  NewListeningResult,
  NewSpeechAttempt,
  SpeechAttempt,
} from '../../types';
import type { IntentoDto, IntentoVozDto } from '../dto/intentos';
import { toAttemptStatus } from './gameCodes';
import { requireText } from './responseShape';

/**
 * Intento de Habla conmigo guardado por el backend. El audio que se ve en
 * «Listo» es el archivo del teléfono, y solo si el backend lo guardó (había
 * autorización): si no, `null`, como en la versión simulada.
 */
export function toSpeechAttempt(
  dto: IntentoVozDto,
  input: NewSpeechAttempt,
): SpeechAttempt {
  return {
    id: requireText(dto.id, 'id'),
    studentId: input.studentId,
    vowel: input.vowel,
    audioUri: dto.grabacionGuardada === true ? input.audioUri : null,
    status: toAttemptStatus(dto.estado),
    createdAt: requireText(dto.fecha, 'fecha'),
    sentForReview: true,
  };
}

/** Resultado de Busca la boca guardado por el backend. */
export function toListeningResult(
  dto: IntentoDto,
  input: NewListeningResult,
): ListeningResult {
  return {
    id: requireText(dto.id, 'id'),
    studentId: input.studentId,
    gameId: 'findMouth',
    firstTryCorrect: input.firstTryCorrect,
    total: input.total,
    status: toAttemptStatus(dto.estado),
    createdAt: requireText(dto.fecha, 'fecha'),
    sentForReview: true,
  };
}

/**
 * `resultado` que pide el backend para cada juego (decisión 11 de la fase 0):
 * Emparejar, Clasificar y Secuenciar, `{ firstTryCorrect, total }`; Memoria,
 * `{ pairs, mismatches }`. Nada más: ni tiempos, ni vidas, ni penalizaciones.
 */
export function toResultado(score: GameScore): Record<string, number> {
  return score.kind === 'turns'
    ? { firstTryCorrect: score.firstTryCorrect, total: score.total }
    : { pairs: score.pairs, mismatches: score.mismatches };
}

/** Resultado de Emparejar, Clasificar, Secuenciar o Memoria guardado. */
export function toGameResult(
  dto: IntentoDto,
  input: NewGameResult,
): GameResult {
  return {
    id: requireText(dto.id, 'id'),
    studentId: input.studentId,
    gameId: input.gameId,
    status: toAttemptStatus(dto.estado),
    createdAt: requireText(dto.fecha, 'fecha'),
    sentForReview: true,
  };
}
