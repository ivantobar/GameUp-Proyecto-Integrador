import { Injectable } from '@nestjs/common';
import {
  saltar,
  type Pagina,
  type Paginacion,
} from '../../../common/paginacion/paginacion.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  esCodigoJuego,
  type Configuracion,
} from '../../catalogo/domain/juegos/estrategia-juego.js';
import { SELECCION_PERSONA } from '../../estudiantes/infrastructure/estudiante.mapper.js';
import type {
  DecisionValidacion,
  GrabacionGuardada,
  ItemRevision,
} from '../domain/validacion.js';
import type {
  AlcanceRevision,
  GrabacionRepository,
  RevisionLecturaRepository,
  ValidacionEscrituraRepository,
} from '../domain/validacion.repository.js';

const SELECCION_PENDIENTE = {
  id: true,
  asignacion_id: true,
  actividad_id: true,
  numero_intento: true,
  fecha: true,
  resultado: true,
  actividad: {
    select: {
      id: true,
      titulo: true,
      configuracion: true,
      tipo_juego: { select: { codigo: true } },
      modulo: { select: { id: true, nombre: true } },
    },
  },
  asignacion: {
    select: {
      estudiante: { select: { usuario: { select: SELECCION_PERSONA } } },
    },
  },
  grabacion_estudiante: { select: { eliminada_en: true } },
} satisfies Prisma.intentoSelect;

function aGrabacion(f: {
  id: bigint;
  intento_id: bigint;
  ruta_audio: string;
  creada_en: Date;
  eliminada_en: Date | null;
}): GrabacionGuardada {
  return {
    id: f.id,
    intentoId: f.intento_id,
    ruta: f.ruta_audio,
    creadaEn: f.creada_en,
    eliminadaEn: f.eliminada_en,
  };
}

@Injectable()
export class PrismaValidacionRepository
  implements
    RevisionLecturaRepository,
    ValidacionEscrituraRepository,
    GrabacionRepository
{
  constructor(private readonly prisma: PrismaService) {}

  // ─── Bandeja «Por escuchar» ───────────────────────────────────────────────

  async pendientes(
    alcance: AlcanceRevision,
    estudianteId: bigint | null,
    paginacion: Paginacion,
  ): Promise<Pagina<ItemRevision>> {
    const asignacion: Prisma.asignacionWhereInput = {};
    if (alcance.tipo === 'tallerista') {
      asignacion.estudiante = {
        tallerista_estudiante: {
          some: { tallerista_id: alcance.talleristaId, activo: true },
        },
      };
    }
    if (estudianteId !== null) asignacion.estudiante_id = estudianteId;
    const where: Prisma.intentoWhereInput = {
      validacion: { is: null },
      asignacion,
    };

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.intento.findMany({
        where,
        select: SELECCION_PENDIENTE,
        // Del más antiguo al más reciente: nadie espera de más.
        orderBy: [{ fecha: 'asc' }, { id: 'asc' }],
        skip: saltar(paginacion),
        take: paginacion.limit,
      }),
      this.prisma.intento.count({ where }),
    ]);

    // Cuántos pendientes hay de cada actividad («intento n de n»).
    const grupos =
      filas.length === 0
        ? []
        : await this.prisma.intento.groupBy({
            by: ['asignacion_id', 'actividad_id'],
            where: {
              validacion: { is: null },
              OR: filas.map((f) => ({
                asignacion_id: f.asignacion_id,
                actividad_id: f.actividad_id,
              })),
            },
            _count: { _all: true },
          });
    const pendientesDe = (a: bigint, b: bigint) =>
      grupos.find((g) => g.asignacion_id === a && g.actividad_id === b)?._count
        ._all ?? 1;

    const items = filas.map((f): ItemRevision => {
      const codigo = f.actividad.tipo_juego.codigo;
      if (!esCodigoJuego(codigo)) throw new Error('Tipo de juego desconocido');
      const vocal = (f.actividad.configuracion as Configuracion)['vocal'];
      const g = f.grabacion_estudiante;
      return {
        intentoId: f.id,
        numeroIntento: f.numero_intento,
        fecha: f.fecha,
        tipoJuego: codigo,
        resultado: (f.resultado ?? {}) as Configuracion,
        estudiante: f.asignacion.estudiante.usuario,
        actividad: {
          id: f.actividad.id,
          titulo: f.actividad.titulo,
          vocal: typeof vocal === 'string' ? vocal : null,
        },
        modulo: f.actividad.modulo,
        pendientesMismaActividad: pendientesDe(f.asignacion_id, f.actividad_id),
        // Sin validar, eliminada_en solo puede venir del plazo de 30 días.
        grabacion: g
          ? {
              disponible: g.eliminada_en === null,
              vencido: g.eliminada_en !== null,
            }
          : null,
      };
    });
    return { items, total, ...paginacion };
  }

  // ─── Validaciones ─────────────────────────────────────────────────────────

  async validar(
    intentoId: bigint,
    validadorId: bigint,
    decision: DecisionValidacion,
  ): Promise<void> {
    // Triggers: rol (DIRECTORA/TALLERISTA), vínculo con el estudiante y
    // recálculo del progreso (aviso AVANCE a los acudientes al completar).
    await this.prisma.validacion.create({
      data: {
        intento_id: intentoId,
        validador_id: validadorId,
        resultado: decision.resultado,
        retroalimentacion: decision.retroalimentacion,
      },
    });
  }

  async aprobarLote(
    intentoIds: bigint[],
    validadorId: bigint,
  ): Promise<number> {
    // Una sola transacción: si una fila falla (p. ej., ya validada), no queda ninguna.
    const creadas = await this.prisma.$transaction(
      intentoIds.map((intentoId) =>
        this.prisma.validacion.create({
          data: {
            intento_id: intentoId,
            validador_id: validadorId,
            resultado: 'APROBADO',
          },
          select: { id: true },
        }),
      ),
    );
    return creadas.length;
  }

  // ─── Grabaciones ──────────────────────────────────────────────────────────

  async buscarPorIntento(intentoId: bigint): Promise<GrabacionGuardada | null> {
    const fila = await this.prisma.grabacion_estudiante.findUnique({
      where: { intento_id: intentoId },
    });
    return fila ? aGrabacion(fila) : null;
  }

  async validadasSinBorrar(limite: number): Promise<GrabacionGuardada[]> {
    // La vista grabacion_por_eliminar (migración de ajustes) no está en el
    // esquema de Prisma: se consulta con SQL parametrizado.
    const filas = await this.prisma.$queryRaw<Array<{ id: bigint }>>`
      select id from public.grabacion_por_eliminar order by validada_en limit ${limite}`;
    if (filas.length === 0) return [];
    const grabaciones = await this.prisma.grabacion_estudiante.findMany({
      where: { id: { in: filas.map((f) => f.id) } },
    });
    return grabaciones.map(aGrabacion);
  }

  async vencidas(antesDe: Date, limite: number): Promise<GrabacionGuardada[]> {
    const filas = await this.prisma.grabacion_estudiante.findMany({
      where: {
        eliminada_en: null,
        creada_en: { lt: antesDe },
        intento: { validacion: { is: null } },
      },
      orderBy: { creada_en: 'asc' },
      take: limite,
    });
    return filas.map(aGrabacion);
  }

  async marcarEliminadas(ids: bigint[], fecha: Date): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.grabacion_estudiante.updateMany({
      where: { id: { in: ids }, eliminada_en: null },
      data: { eliminada_en: fecha },
    });
  }
}
