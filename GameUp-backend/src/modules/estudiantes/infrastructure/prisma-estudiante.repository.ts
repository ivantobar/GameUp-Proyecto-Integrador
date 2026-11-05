import { Injectable } from '@nestjs/common';
import {
  saltar,
  type Pagina,
  type Paginacion,
} from '../../../common/paginacion/paginacion.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { AlcanceEstudiantes } from '../domain/alcance.js';
import type {
  CambioNivel,
  Estudiante,
  TalleristaAsignada,
  VinculoAcudiente,
} from '../domain/estudiante.entity.js';
import type {
  AcudienteEstudianteRepository,
  EstudianteLecturaRepository,
  FiltroEstudiantes,
  NivelEstudianteRepository,
  TalleristaEstudianteRepository,
} from '../domain/estudiante.repository.js';
import {
  EstudianteMapper,
  SELECCION_ESTUDIANTE,
  SELECCION_PERSONA,
} from './estudiante.mapper.js';

/*
 * OJO: por el índice parcial uq_acudiente_principal, Prisma cree que
 * acudiente_estudiante.estudiante_id es único y modela la relación
 * estudiante → acudiente_estudiante como 1:1. En la base es 1:N (varios
 * acudientes por estudiante). Por eso esa tabla se consulta SIEMPRE
 * directamente (findMany o clave compuesta), nunca por esa relación.
 */

@Injectable()
export class PrismaEstudianteRepository
  implements EstudianteLecturaRepository, NivelEstudianteRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: bigint): Promise<Estudiante | null> {
    const fila = await this.prisma.estudiante.findUnique({
      where: { usuario_id: id },
      select: SELECCION_ESTUDIANTE,
    });
    return fila ? EstudianteMapper.aEntidad(fila) : null;
  }

  async listar(
    alcance: AlcanceEstudiantes,
    filtro: FiltroEstudiantes,
    paginacion: Paginacion,
  ): Promise<Pagina<Estudiante>> {
    const where: Prisma.estudianteWhereInput = {
      AND: [await this.whereAlcance(alcance)],
    };
    if (filtro.estado !== null) where.estado = filtro.estado;
    if (filtro.nivelId !== null) where.nivel_id = filtro.nivelId;

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.estudiante.findMany({
        where,
        select: SELECCION_ESTUDIANTE,
        orderBy: [
          { usuario: { nombres: 'asc' } },
          { usuario: { apellidos: 'asc' } },
          { usuario_id: 'asc' },
        ],
        skip: saltar(paginacion),
        take: paginacion.limit,
      }),
      this.prisma.estudiante.count({ where }),
    ]);
    return {
      items: filas.map(EstudianteMapper.aEntidad),
      total,
      ...paginacion,
    };
  }

  async estaEnAlcance(
    alcance: AlcanceEstudiantes,
    estudianteId: bigint,
  ): Promise<boolean> {
    switch (alcance.tipo) {
      case 'todos':
        return (
          (await this.prisma.estudiante.count({
            where: { usuario_id: estudianteId },
          })) > 0
        );
      case 'propio':
        return (
          alcance.estudianteId === estudianteId &&
          (await this.prisma.estudiante.count({
            where: { usuario_id: estudianteId },
          })) > 0
        );
      case 'tallerista':
        return (
          (await this.prisma.tallerista_estudiante.count({
            where: {
              tallerista_id: alcance.talleristaId,
              estudiante_id: estudianteId,
              activo: true,
            },
          })) > 0
        );
      case 'acudiente':
        return (
          (await this.prisma.acudiente_estudiante.count({
            where: {
              acudiente_id: alcance.acudienteId,
              estudiante_id: estudianteId,
            },
          })) > 0
        );
    }
  }

  async historialNivel(
    estudianteId: bigint,
    paginacion: Paginacion,
  ): Promise<Pagina<CambioNivel>> {
    const where = { estudiante_id: estudianteId };
    const [filas, total] = await this.prisma.$transaction([
      this.prisma.historial_nivel.findMany({
        where,
        select: {
          id: true,
          motivo: true,
          fecha: true,
          nivel: { select: { id: true, nombre: true } },
          usuario: { select: SELECCION_PERSONA },
        },
        orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
        skip: saltar(paginacion),
        take: paginacion.limit,
      }),
      this.prisma.historial_nivel.count({ where }),
    ]);
    return {
      items: filas.map((f) => ({
        id: f.id,
        nivel: f.nivel,
        motivo: f.motivo,
        fecha: f.fecha,
        asignadoPor: f.usuario,
      })),
      total,
      ...paginacion,
    };
  }

  async cambiarNivel(
    estudianteId: bigint,
    nivelId: bigint,
    directoraId: bigint,
    motivo: string | null,
  ): Promise<void> {
    // La función guarda historial_nivel (su trigger exige rol DIRECTORA),
    // actualiza estudiante.nivel_id y notifica a los acudientes.
    await this.prisma.$executeRaw`
      select public.cambiar_nivel(
        ${estudianteId}::bigint, ${nivelId}::bigint, ${directoraId}::bigint, ${motivo}::text)`;
  }

  private async whereAlcance(
    alcance: AlcanceEstudiantes,
  ): Promise<Prisma.estudianteWhereInput> {
    switch (alcance.tipo) {
      case 'todos':
        return {};
      case 'propio':
        return { usuario_id: alcance.estudianteId };
      case 'tallerista':
        return {
          tallerista_estudiante: {
            some: { tallerista_id: alcance.talleristaId, activo: true },
          },
        };
      case 'acudiente': {
        const vinculos = await this.prisma.acudiente_estudiante.findMany({
          where: { acudiente_id: alcance.acudienteId },
          select: { estudiante_id: true },
        });
        return { usuario_id: { in: vinculos.map((v) => v.estudiante_id) } };
      }
    }
  }
}

@Injectable()
export class PrismaTalleristaEstudianteRepository implements TalleristaEstudianteRepository {
  constructor(private readonly prisma: PrismaService) {}

  private static readonly SELECCION = {
    fecha_inicio: true,
    activo: true,
    usuario: { select: SELECCION_PERSONA },
  } satisfies Prisma.tallerista_estudianteSelect;

  async listar(estudianteId: bigint): Promise<TalleristaAsignada[]> {
    const filas = await this.prisma.tallerista_estudiante.findMany({
      where: { estudiante_id: estudianteId },
      select: PrismaTalleristaEstudianteRepository.SELECCION,
      orderBy: [{ activo: 'desc' }, { fecha_inicio: 'desc' }],
    });
    return filas.map(EstudianteMapper.aTalleristaAsignada);
  }

  async buscar(
    talleristaId: bigint,
    estudianteId: bigint,
  ): Promise<TalleristaAsignada | null> {
    const fila = await this.prisma.tallerista_estudiante.findUnique({
      where: {
        tallerista_id_estudiante_id: {
          tallerista_id: talleristaId,
          estudiante_id: estudianteId,
        },
      },
      select: PrismaTalleristaEstudianteRepository.SELECCION,
    });
    return fila ? EstudianteMapper.aTalleristaAsignada(fila) : null;
  }

  async activar(
    talleristaId: bigint,
    estudianteId: bigint,
    desde: Date,
  ): Promise<TalleristaAsignada> {
    const fila = await this.prisma.tallerista_estudiante.upsert({
      where: {
        tallerista_id_estudiante_id: {
          tallerista_id: talleristaId,
          estudiante_id: estudianteId,
        },
      },
      create: {
        tallerista_id: talleristaId,
        estudiante_id: estudianteId,
        fecha_inicio: desde,
        activo: true,
      },
      update: { activo: true, fecha_inicio: desde },
      select: PrismaTalleristaEstudianteRepository.SELECCION,
    });
    return EstudianteMapper.aTalleristaAsignada(fila);
  }

  async desactivar(
    talleristaId: bigint,
    estudianteId: bigint,
  ): Promise<boolean> {
    const { count } = await this.prisma.tallerista_estudiante.updateMany({
      where: {
        tallerista_id: talleristaId,
        estudiante_id: estudianteId,
        activo: true,
      },
      data: { activo: false },
    });
    return count > 0;
  }
}

@Injectable()
export class PrismaAcudienteEstudianteRepository implements AcudienteEstudianteRepository {
  constructor(private readonly prisma: PrismaService) {}

  private static readonly SELECCION = {
    parentesco: true,
    es_principal: true,
    usuario: { select: SELECCION_PERSONA },
  } satisfies Prisma.acudiente_estudianteSelect;

  private static clave(acudienteId: bigint, estudianteId: bigint) {
    return {
      acudiente_id_estudiante_id: {
        acudiente_id: acudienteId,
        estudiante_id: estudianteId,
      },
    };
  }

  async listar(estudianteId: bigint): Promise<VinculoAcudiente[]> {
    const filas = await this.prisma.acudiente_estudiante.findMany({
      where: { estudiante_id: estudianteId },
      select: PrismaAcudienteEstudianteRepository.SELECCION,
      orderBy: [{ es_principal: 'desc' }, { usuario: { nombres: 'asc' } }],
    });
    return filas.map(EstudianteMapper.aVinculoAcudiente);
  }

  async buscar(
    acudienteId: bigint,
    estudianteId: bigint,
  ): Promise<VinculoAcudiente | null> {
    const fila = await this.prisma.acudiente_estudiante.findUnique({
      where: PrismaAcudienteEstudianteRepository.clave(
        acudienteId,
        estudianteId,
      ),
      select: PrismaAcudienteEstudianteRepository.SELECCION,
    });
    return fila ? EstudianteMapper.aVinculoAcudiente(fila) : null;
  }

  async crear(
    acudienteId: bigint,
    estudianteId: bigint,
    parentesco: string,
    esPrincipal: boolean,
  ): Promise<VinculoAcudiente> {
    const fila = await this.prisma.acudiente_estudiante.create({
      data: {
        acudiente_id: acudienteId,
        estudiante_id: estudianteId,
        parentesco,
        es_principal: esPrincipal,
      },
      select: PrismaAcudienteEstudianteRepository.SELECCION,
    });
    return EstudianteMapper.aVinculoAcudiente(fila);
  }

  async actualizar(
    acudienteId: bigint,
    estudianteId: bigint,
    cambios: { parentesco: string | null; esPrincipal: boolean | null },
  ): Promise<VinculoAcudiente> {
    const data: Prisma.acudiente_estudianteUpdateInput = {};
    if (cambios.parentesco !== null) data.parentesco = cambios.parentesco;
    if (cambios.esPrincipal !== null) data.es_principal = cambios.esPrincipal;

    const fila = await this.prisma.$transaction(async (tx) => {
      if (cambios.esPrincipal === true) {
        // Primero se quita la marca al principal anterior: el índice parcial
        // uq_acudiente_principal no admite dos principales a la vez.
        await tx.acudiente_estudiante.updateMany({
          where: {
            estudiante_id: estudianteId,
            es_principal: true,
            NOT: { acudiente_id: acudienteId },
          },
          data: { es_principal: false },
        });
      }
      return tx.acudiente_estudiante.update({
        where: PrismaAcudienteEstudianteRepository.clave(
          acudienteId,
          estudianteId,
        ),
        data,
        select: PrismaAcudienteEstudianteRepository.SELECCION,
      });
    });
    return EstudianteMapper.aVinculoAcudiente(fila);
  }

  async eliminar(acudienteId: bigint, estudianteId: bigint): Promise<boolean> {
    const { count } = await this.prisma.acudiente_estudiante.deleteMany({
      where: { acudiente_id: acudienteId, estudiante_id: estudianteId },
    });
    return count > 0;
  }
}
