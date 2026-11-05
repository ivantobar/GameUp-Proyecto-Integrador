import { Inject, Injectable } from '@nestjs/common';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import { RecursoNoEncontradoError } from '../../../common/errors/dominio.errors.js';
import type {
  Pagina,
  Paginacion,
} from '../../../common/paginacion/paginacion.js';
import type { Notificacion } from '../domain/notificacion.entity.js';
import {
  NOTIFICACION_REPOSITORY,
  type NotificacionRepository,
} from '../domain/notificacion.repository.js';

export interface BandejaNotificaciones {
  pagina: Pagina<Notificacion>;
  /** Para el globo del ícono, sin importar el filtro. */
  noLeidas: number;
}

/** Los avisos de quien tiene la sesión. Cualquier rol; solo los propios. */
@Injectable()
export class NotificacionService {
  constructor(
    @Inject(NOTIFICACION_REPOSITORY)
    private readonly notificaciones: NotificacionRepository,
  ) {}

  async listar(
    actual: UsuarioAutenticado,
    leida: boolean | null,
    paginacion: Paginacion,
  ): Promise<BandejaNotificaciones> {
    const [pagina, noLeidas] = await Promise.all([
      this.notificaciones.listar(actual.id, leida, paginacion),
      this.notificaciones.contarNoLeidas(actual.id),
    ]);
    return { pagina, noLeidas };
  }

  /** Idempotente. La de otra persona → 404, igual que una inexistente. */
  async marcarLeida(
    actual: UsuarioAutenticado,
    id: bigint,
  ): Promise<Notificacion> {
    const notificacion = await this.notificaciones.marcarLeida(id, actual.id);
    if (!notificacion)
      throw new RecursoNoEncontradoError('La notificación no existe.');
    return notificacion;
  }

  marcarTodasLeidas(actual: UsuarioAutenticado): Promise<number> {
    return this.notificaciones.marcarTodasLeidas(actual.id);
  }
}
