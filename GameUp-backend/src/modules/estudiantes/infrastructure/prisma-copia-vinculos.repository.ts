import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type {
  CopiaVinculosRepository,
  VinculoLocal,
} from '../domain/vinculos-externos.js';

@Injectable()
export class PrismaCopiaVinculosRepository implements CopiaVinculosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async estudiantesPorExterno(
    externos: bigint[],
  ): Promise<Map<bigint, bigint>> {
    if (externos.length === 0) return new Map();
    const filas = await this.prisma.estudiante.findMany({
      where: { id_estudiante_externo: { in: externos } },
      select: { usuario_id: true, id_estudiante_externo: true },
    });
    return new Map(filas.map((f) => [f.id_estudiante_externo, f.usuario_id]));
  }

  async reemplazarDeAcudiente(
    acudienteId: bigint,
    vinculos: VinculoLocal[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.acudiente_estudiante.deleteMany({
        where: {
          acudiente_id: acudienteId,
          estudiante_id: { notIn: vinculos.map((v) => v.estudianteId) },
        },
      });
      for (const v of vinculos) {
        if (v.esPrincipal) {
          // uq_acudiente_principal: un solo principal por estudiante.
          await tx.acudiente_estudiante.updateMany({
            where: {
              estudiante_id: v.estudianteId,
              es_principal: true,
              NOT: { acudiente_id: acudienteId },
            },
            data: { es_principal: false },
          });
        }
        // Sin upsert: Prisma lo traduce a INSERT ... ON CONFLICT y elige el
        // índice parcial uq_acudiente_principal (estudiante_id WHERE
        // es_principal), que PostgreSQL no acepta sin su WHERE («there is no
        // unique or exclusion constraint matching the ON CONFLICT
        // specification»). Se actualiza y, si no había fila, se crea; todo
        // dentro de la transacción.
        const actualizados = await tx.acudiente_estudiante.updateMany({
          where: { acudiente_id: acudienteId, estudiante_id: v.estudianteId },
          data: { parentesco: v.parentesco, es_principal: v.esPrincipal },
        });
        if (actualizados.count === 0) {
          await tx.acudiente_estudiante.create({
            data: {
              acudiente_id: acudienteId,
              estudiante_id: v.estudianteId,
              parentesco: v.parentesco,
              es_principal: v.esPrincipal,
            },
          });
        }
      }
    });
  }
}
