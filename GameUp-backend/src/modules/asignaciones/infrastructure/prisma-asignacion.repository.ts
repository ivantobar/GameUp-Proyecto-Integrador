import { Injectable } from '@nestjs/common';
import {
  saltar,
  type Pagina,
  type Paginacion,
} from '../../../common/paginacion/paginacion.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { AlcanceEstudiantes } from '../../estudiantes/domain/alcance.js';
import type {
  Asignacion,
  IntentoResumen,
} from '../domain/asignacion.entity.js';
import type {
  AsignacionEscrituraRepository,
  AsignacionLecturaRepository,
  FiltroAsignaciones,
  NuevaAsignacion,
} from '../domain/asignacion.repository.js';
import {
  AsignacionMapper,
  SELECCION_ASIGNACION,
  SELECCION_INTENTO,
} from './asignacion.mapper.js';

/*
 * OJO: Prisma expone `modulo_id_estudiante_id` como clave única porque
 * uq_asignacion_activa es un índice PARCIAL (solo para estado <> COMPLETADO).
 * Un estudiante puede tener varias asignaciones COMPLETADO del mismo módulo:
 * nunca se usa findUnique con esa clave; se filtra por estado.
 */

@Injectable()
export class PrismaAsignacionRepository
  implements AsignacionLecturaRepository, AsignacionEscrituraRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: bigint): Promise<Asignacion | null> {
    const fila = await this.prisma.asignacion.findUnique({
      where: { id },
      select: SELECCION_ASIGNACION,
    });
    return fila ? AsignacionMapper.aEntidad(fila) : null;
  }

  async listar(
    alcance: AlcanceEstudiantes,
    filtro: FiltroAsignaciones,
    paginacion: Paginacion,
  ): Promise<Pagina<Asignacion>> {
    const condiciones: Prisma.asignacionWhereInput[] = [
      await this.whereAlcance(alcance),
    ];
    if (filtro.estudianteId !== null) {
      condiciones.push({ estudiante_id: filtro.estudianteId });
    }
    if (filtro.moduloId !== null)
      condiciones.push({ modulo_id: filtro.moduloId });
    if (filtro.estado !== null) condiciones.push({ estado: filtro.estado });
    const where: Prisma.asignacionWhereInput = { AND: condiciones };

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.asignacion.findMany({
        where,
        select: SELECCION_ASIGNACION,
        orderBy: [{ fecha_asignacion: 'desc' }, { id: 'desc' }],
        skip: saltar(paginacion),
        take: paginacion.limit,
      }),
      this.prisma.asignacion.count({ where }),
    ]);
    return {
      items: filas.map(AsignacionMapper.aEntidad),
      total,
      ...paginacion,
    };
  }

  async activasDelEstudiante(estudianteId: bigint): Promise<Asignacion[]> {
    const filas = await this.prisma.asignacion.findMany({
      where: { estudiante_id: estudianteId, estado: { not: 'COMPLETADO' } },
      select: SELECCION_ASIGNACION,
      orderBy: [
        { fecha_sugerida: { sort: 'asc', nulls: 'last' } },
        { id: 'asc' },
      ],
    });
    return filas.map(AsignacionMapper.aEntidad);
  }

  async existeActiva(moduloId: bigint, estudianteId: bigint): Promise<boolean> {
    return (
      (await this.prisma.asignacion.count({
        where: {
          modulo_id: moduloId,
          estudiante_id: estudianteId,
          estado: { not: 'COMPLETADO' },
        },
      })) > 0
    );
  }

  async intentos(
    asignacionIds: bigint[],
  ): Promise<Map<bigint, IntentoResumen[]>> {
    const resultado = new Map<bigint, IntentoResumen[]>(
      asignacionIds.map((id) => [id, []]),
    );
    if (asignacionIds.length === 0) return resultado;
    const filas = await this.prisma.intento.findMany({
      where: { asignacion_id: { in: asignacionIds } },
      select: SELECCION_INTENTO,
      orderBy: [{ actividad_id: 'asc' }, { numero_intento: 'asc' }],
    });
    for (const f of filas) {
      resultado.get(f.asignacion_id)?.push(AsignacionMapper.aIntento(f));
    }
    return resultado;
  }

  async crear(datos: NuevaAsignacion): Promise<Asignacion> {
    // Triggers: rol (DIRECTORA/TALLERISTA), vínculo con el estudiante,
    // módulo publicado y aviso NUEVO_MODULO a los acudientes.
    const fila = await this.prisma.asignacion.create({
      data: {
        modulo_id: datos.moduloId,
        estudiante_id: datos.estudianteId,
        asignado_por: datos.asignadoPor,
        fecha_sugerida: datos.fechaSugerida,
      },
      select: SELECCION_ASIGNACION,
    });
    return AsignacionMapper.aEntidad(fila);
  }

  async eliminar(id: bigint): Promise<void> {
    await this.prisma.asignacion.delete({ where: { id } });
  }

  private async whereAlcance(
    alcance: AlcanceEstudiantes,
  ): Promise<Prisma.asignacionWhereInput> {
    switch (alcance.tipo) {
      case 'todos':
        return {};
      case 'propio':
        return { estudiante_id: alcance.estudianteId };
      case 'tallerista':
        return {
          estudiante: {
            tallerista_estudiante: {
              some: { tallerista_id: alcance.talleristaId, activo: true },
            },
          },
        };
      case 'acudiente': {
        // Ver la nota sobre acudiente_estudiante en prisma-estudiante.repository.ts.
        const vinculos = await this.prisma.acudiente_estudiante.findMany({
          where: { acudiente_id: alcance.acudienteId },
          select: { estudiante_id: true },
        });
        return { estudiante_id: { in: vinculos.map((v) => v.estudiante_id) } };
      }
    }
  }
}
