import type {
  Pagina,
  Paginacion,
} from '../../../common/paginacion/paginacion.js';
import type { Notificacion } from './notificacion.entity.js';

/**
 * Avisos de UNA persona. Todas las operaciones van filtradas por su
 * usuario_id: nadie lee ni marca los avisos de otro.
 */
export interface NotificacionRepository {
  /** De la más reciente a la más antigua. `leida` null: todas. */
  listar(
    usuarioId: bigint,
    leida: boolean | null,
    paginacion: Paginacion,
  ): Promise<Pagina<Notificacion>>;
  contarNoLeidas(usuarioId: bigint): Promise<number>;
  /** null si no existe o es de otra persona. */
  marcarLeida(id: bigint, usuarioId: bigint): Promise<Notificacion | null>;
  /** Devuelve cuántas se marcaron. */
  marcarTodasLeidas(usuarioId: bigint): Promise<number>;
}

export const NOTIFICACION_REPOSITORY = Symbol('NOTIFICACION_REPOSITORY');
