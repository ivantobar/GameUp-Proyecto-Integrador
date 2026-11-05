import { Injectable } from '@nestjs/common';
import {
  saltar,
  type Pagina,
  type Paginacion,
} from '../../../common/paginacion/paginacion.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { Observacion } from '../domain/observacion.entity.js';
import type {
  CambiosObservacion,
  NuevaObservacion,
  ObservacionEscrituraRepository,
  ObservacionLecturaRepository,
} from '../domain/observacion.repository.js';
import {
  ObservacionMapper,
  SELECCION_OBSERVACION,
} from './observacion.mapper.js';

@Injectable()
export class PrismaObservacionRepository
  implements ObservacionLecturaRepository, ObservacionEscrituraRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: bigint): Promise<Observacion | null> {
    const fila = await this.prisma.observacion.findUnique({
      where: { id },
      select: SELECCION_OBSERVACION,
    });
    return fila ? ObservacionMapper.aEntidad(fila) : null;
  }

  async listar(
    estudianteId: bigint,
    soloVisiblesAcudiente: boolean,
    paginacion: Paginacion,
  ): Promise<Pagina<Observacion>> {
    const where: Prisma.observacionWhereInput = {
      estudiante_id: estudianteId,
      ...(soloVisiblesAcudiente ? { visible_acudiente: true } : {}),
    };
    const [filas, total] = await this.prisma.$transaction([
      this.prisma.observacion.findMany({
        where,
        select: SELECCION_OBSERVACION,
        // Índice ix_observacion_estudiante (estudiante_id, fecha desc).
        orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
        skip: saltar(paginacion),
        take: paginacion.limit,
      }),
      this.prisma.observacion.count({ where }),
    ]);
    return {
      items: filas.map(ObservacionMapper.aEntidad),
      total,
      ...paginacion,
    };
  }

  async crear(d: NuevaObservacion): Promise<Observacion> {
    // Triggers: trg_rol_observacion, trg_vinculo_observacion y
    // trg_observacion_notificar (aviso OBSERVACION si es visible).
    const fila = await this.prisma.observacion.create({
      data: {
        estudiante_id: d.estudianteId,
        autor_id: d.autorId,
        texto: d.texto,
        visible_acudiente: d.visibleAcudiente,
      },
      select: SELECCION_OBSERVACION,
    });
    return ObservacionMapper.aEntidad(fila);
  }

  async actualizar(
    id: bigint,
    cambios: CambiosObservacion,
  ): Promise<Observacion> {
    const data: Prisma.observacionUpdateInput = {};
    if (cambios.texto !== null) data.texto = cambios.texto;
    if (cambios.visibleAcudiente !== null)
      data.visible_acudiente = cambios.visibleAcudiente;
    const fila = await this.prisma.observacion.update({
      where: { id },
      data,
      select: SELECCION_OBSERVACION,
    });
    return ObservacionMapper.aEntidad(fila);
  }
}
