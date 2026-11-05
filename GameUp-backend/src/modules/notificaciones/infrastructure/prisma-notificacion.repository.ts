import { Injectable } from '@nestjs/common';
import {
  saltar,
  type Pagina,
  type Paginacion,
} from '../../../common/paginacion/paginacion.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { Notificacion } from '../domain/notificacion.entity.js';
import type { NotificacionRepository } from '../domain/notificacion.repository.js';
import {
  NotificacionMapper,
  SELECCION_NOTIFICACION,
} from './notificacion.mapper.js';

@Injectable()
export class PrismaNotificacionRepository implements NotificacionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listar(
    usuarioId: bigint,
    leida: boolean | null,
    paginacion: Paginacion,
  ): Promise<Pagina<Notificacion>> {
    const where: Prisma.notificacionWhereInput = {
      usuario_id: usuarioId,
      ...(leida === null ? {} : { leida }),
    };
    const [filas, total] = await this.prisma.$transaction([
      this.prisma.notificacion.findMany({
        where,
        select: SELECCION_NOTIFICACION,
        // Índice ix_notificacion_usuario (usuario_id, leida, fecha desc).
        orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
        skip: saltar(paginacion),
        take: paginacion.limit,
      }),
      this.prisma.notificacion.count({ where }),
    ]);
    return {
      items: filas.map(NotificacionMapper.aEntidad),
      total,
      ...paginacion,
    };
  }

  contarNoLeidas(usuarioId: bigint): Promise<number> {
    return this.prisma.notificacion.count({
      where: { usuario_id: usuarioId, leida: false },
    });
  }

  async marcarLeida(
    id: bigint,
    usuarioId: bigint,
  ): Promise<Notificacion | null> {
    // updateMany con usuario_id: si es de otra persona, no toca nada.
    const { count } = await this.prisma.notificacion.updateMany({
      where: { id, usuario_id: usuarioId },
      data: { leida: true },
    });
    if (count === 0) return null;
    const fila = await this.prisma.notificacion.findUnique({
      where: { id },
      select: SELECCION_NOTIFICACION,
    });
    return fila ? NotificacionMapper.aEntidad(fila) : null;
  }

  async marcarTodasLeidas(usuarioId: bigint): Promise<number> {
    const { count } = await this.prisma.notificacion.updateMany({
      where: { usuario_id: usuarioId, leida: false },
      data: { leida: true },
    });
    return count;
  }
}
