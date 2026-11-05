import type { ActivityStatus, GameId } from '../../types';
import type {
  CodigoJuego,
  EstadoActividad,
  EstadoIntento,
} from '../dto/juegos';
import { unexpected } from './responseShape';

/** Código de juego del backend → juego de la app. */
const JUEGOS: Record<CodigoJuego, GameId> = {
  EMPAREJAR: 'match',
  CLASIFICAR: 'classify',
  SECUENCIAR: 'sequence',
  MEMORIA: 'memory',
  HABLA_CONMIGO: 'speak',
  BUSCA_LA_BOCA: 'findMouth',
};

/**
 * Estado de una actividad del backend → estado que muestra la app. Solo
 * `validated` (APROBADA) cuenta para el progreso oficial.
 */
const ESTADOS_ACTIVIDAD: Record<EstadoActividad, ActivityStatus> = {
  SIN_INTENTOS: 'assigned',
  PENDIENTE_VALIDACION: 'pending_validation',
  RECHAZADA: 'rejected',
  APROBADA: 'validated',
};

const ESTADOS_INTENTO: Record<EstadoIntento, ActivityStatus> = {
  PENDIENTE_VALIDACION: 'pending_validation',
  APROBADO: 'validated',
  RECHAZADO: 'rejected',
};

function lookup<K extends string, V>(
  table: Record<K, V>,
  value: unknown,
  field: string,
): V {
  if (typeof value === 'string' && value in table) return table[value as K];
  throw unexpected(field);
}

export const toGameId = (codigo: unknown): GameId =>
  lookup(JUEGOS, codigo, 'tipoJuego');

export const toActivityStatus = (estado: unknown): ActivityStatus =>
  lookup(ESTADOS_ACTIVIDAD, estado, 'estado de la actividad');

export const toAttemptStatus = (estado: unknown): ActivityStatus =>
  lookup(ESTADOS_INTENTO, estado, 'estado del intento');
