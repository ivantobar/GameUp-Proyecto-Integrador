import { Injectable } from '@nestjs/common';
import {
  aFechaSinHora,
  fechaSinHoraATexto,
} from '../../../common/fechas/fechas.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { PracticaCasaRepository } from '../domain/practica-casa.repository.js';

@Injectable()
export class PrismaPracticaCasaRepository implements PracticaCasaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(
    estudianteId: bigint,
    acudienteId: bigint,
    fecha: string,
  ): Promise<void> {
    // Triggers: trg_rol_practica_casa y trg_vinculo_practica_casa.
    // update vacío: si ya estaba marcado, se conserva registrada_en.
    const dia = aFechaSinHora(fecha);
    await this.prisma.practica_casa.upsert({
      where: {
        estudiante_id_acudiente_id_fecha: {
          estudiante_id: estudianteId,
          acudiente_id: acudienteId,
          fecha: dia,
        },
      },
      create: {
        estudiante_id: estudianteId,
        acudiente_id: acudienteId,
        fecha: dia,
      },
      update: {},
    });
  }

  async diasPracticados(
    estudianteId: bigint,
    desde: string,
    hasta: string,
  ): Promise<string[]> {
    const filas = await this.prisma.practica_casa.findMany({
      where: {
        estudiante_id: estudianteId,
        fecha: { gte: aFechaSinHora(desde), lte: aFechaSinHora(hasta) },
      },
      select: { fecha: true },
      distinct: ['fecha'],
      orderBy: { fecha: 'asc' },
    });
    return filas.map((f) => fechaSinHoraATexto(f.fecha));
  }
}
