import {
  isVowel,
  type GameScore,
  type NoAudioReason,
  type PendingReviewSummary,
  type ReviewItem,
  type ThinkingGameId,
} from '../../types';
import type { ItemRevisionDto, ResumenPendientesDto } from '../dto/revisiones';
import { toGameId } from './gameCodes';
import { requireCount, requireText, unexpected } from './responseShape';

/** `estadoGrabacion` del backend → por qué no hay audio. */
const MOTIVOS_SIN_AUDIO: Record<string, NoAudioReason> = {
  SIN_CONSENTIMIENTO: 'noConsent',
  NO_VERIFICABLE: 'notVerified',
  NO_ENVIADA: 'notSent',
  NO_GUARDADA: 'notSaved',
};

const count = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;

function speechOf(dto: ItemRevisionDto): NonNullable<ReviewItem['speech']> {
  const vowel = dto.actividad?.vocal;
  if (typeof vowel !== 'string' || !isVowel(vowel)) {
    throw unexpected('actividad.vocal');
  }
  const estado = dto.resultado?.['estadoGrabacion'];
  const speech: NonNullable<ReviewItem['speech']> = {
    vowel,
    // El audio no viaja en la lista: se pide aparte (URL firmada).
    audioUri: null,
    remoteAudio: dto.grabacion?.disponible === true,
    audioExpired: dto.grabacion?.vencido === true,
    voiceConsent: dto.consentimientoVoz === true,
    attemptNumber: count(dto.numeroIntento),
    // «intento n de n»: nunca menos que el número del intento.
    attemptsTotal: Math.max(
      count(dto.numeroIntento),
      count(dto.pendientesMismaActividad),
    ),
  };
  const reason = typeof estado === 'string' ? MOTIVOS_SIN_AUDIO[estado] : null;
  if (!dto.grabacion && reason) speech.noAudioReason = reason;
  return speech;
}

function scoreOf(
  gameId: ThinkingGameId,
  resultado: Record<string, unknown>,
): GameScore {
  return gameId === 'memory'
    ? {
        kind: 'memory',
        pairs: count(resultado['pairs']),
        mismatches: count(resultado['mismatches']),
      }
    : {
        kind: 'turns',
        firstTryCorrect: count(resultado['firstTryCorrect']),
        total: count(resultado['total']),
      };
}

/** Un estudiante del resumen → tarjeta de la lista de «Por escuchar». */
export function toPendingSummary(
  dto: ResumenPendientesDto,
): PendingReviewSummary {
  return {
    student: {
      id: requireText(dto?.estudianteId, 'estudianteId'),
      displayName: requireText(dto.nombre, 'nombre'),
      initials: requireText(dto.iniciales, 'iniciales'),
    },
    pending: requireCount(dto.pendientes, 'pendientes'),
    oldestAt: requireText(dto.masAntiguo, 'masAntiguo'),
  };
}

/**
 * Un intento de la bandeja del backend → tarjeta de «Por escuchar». El
 * backend ya filtra: la tallerista solo recibe a SUS estudiantes.
 */
export function toReviewItem(dto: ItemRevisionDto): ReviewItem {
  const base = {
    id: requireText(dto.intentoId, 'intentoId'),
    student: {
      id: requireText(dto.estudiante?.id, 'estudiante.id'),
      displayName: requireText(
        dto.estudiante?.displayName,
        'estudiante.displayName',
      ),
      initials: dto.estudiante?.initials ?? '',
    },
    submittedAt: requireText(dto.fecha, 'fecha'),
    status: 'pending_validation' as const,
  };
  const resultado = dto.resultado ?? {};
  const gameId = toGameId(dto.tipoJuego);

  switch (gameId) {
    case 'speak':
      return { ...base, kind: 'speech', speech: speechOf(dto) };
    case 'findMouth':
      return {
        ...base,
        kind: 'listening',
        listening: {
          firstTryCorrect: count(resultado['firstTryCorrect']),
          total: count(resultado['total']),
        },
      };
    default:
      return {
        ...base,
        kind: 'game',
        game: {
          gameId,
          title: dto.actividad?.titulo ?? '',
          score: scoreOf(gameId, resultado),
          level:
            typeof dto.actividad?.nivelJuego === 'number'
              ? dto.actividad.nivelJuego
              : null,
          pendingSameActivity: count(dto.pendientesMismaActividad) || 1,
        },
      };
  }
}
