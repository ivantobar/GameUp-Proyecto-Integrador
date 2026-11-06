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
import type { SubidaNivel } from '../../niveles-juego/domain/nivel-juego.js';
import { subirSiCorresponde } from '../../niveles-juego/infrastructure/subida-en-transaccion.js';
import type {
  DecisionValidacion,
  GrabacionGuardada,
  ItemRevision,
} from '../domain/validacion.js';
import type {
  AlcanceRevision,
  GrabacionRepository,
  ResultadoLote,
  RevisionLecturaRepository,
  ValidacionEscrituraRepository,
} from '../domain/validacion.repository.js';

/**
 * Validar y subir de nivel van en una transacción interactiva. Con Supabase,
 * cada consulta tarda; un lote de 50 necesita más que los 5 s por defecto.
 */
const OPCIONES_TRANSACCION = { maxWait: 5_000, timeout: 20_000 };

const SELECCION_PENDIENTE = {
  id: true,
  asignacion_id: true,
  estudiante_id: true,
  actividad_id: true,
  numero_intento: true,
  fecha: true,
  resultado: true,
  actividad: {
    select: {
      id: true,
      titulo: true,
      configuracion: true,
      nivel_juego: true,
      tipo_juego: { select: { codigo: true } },
      modulo: { select: { id: true, nombre: true } },
    },
  },
  estudiante: { select: { usuario: { select: SELECCION_PERSONA } } },
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
    // Por el estudiante del intento: con o sin asignación (escalera). De la
    // escalera solo se ven los del nivel actual, y de cada nivel el más
    // reciente (pendientesMismaActividad dice cuántos esperan).
    const escalera = await this.escaleraVisible();
    const where: Prisma.intentoWhereInput = {
      validacion: { is: null },
      OR: [{ asignacion_id: { not: null } }, { id: { in: escalera } }],
    };
    if (alcance.tipo === 'tallerista') {
      where.estudiante = {
        tallerista_estudiante: {
          some: { tallerista_id: alcance.talleristaId, activo: true },
        },
      };
    }
    if (estudianteId !== null) where.estudiante_id = estudianteId;

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

    // Cuántos pendientes hay de cada actividad («intento n de n»), por
    // estudiante y asignación (vacía en la escalera).
    const grupos =
      filas.length === 0
        ? []
        : await this.prisma.intento.groupBy({
            by: ['asignacion_id', 'estudiante_id', 'actividad_id'],
            where: {
              validacion: { is: null },
              OR: filas.map((f) => ({
                asignacion_id: f.asignacion_id,
                estudiante_id: f.estudiante_id,
                actividad_id: f.actividad_id,
              })),
            },
            _count: { _all: true },
          });
    const pendientesDe = (f: (typeof filas)[number]) =>
      grupos.find(
        (g) =>
          g.asignacion_id === f.asignacion_id &&
          g.estudiante_id === f.estudiante_id &&
          g.actividad_id === f.actividad_id,
      )?._count._all ?? 1;

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
        estudiante: f.estudiante.usuario,
        actividad: {
          id: f.actividad.id,
          titulo: f.actividad.titulo,
          vocal: typeof vocal === 'string' ? vocal : null,
          nivelJuego: f.actividad.nivel_juego,
        },
        modulo: f.actividad.modulo,
        pendientesMismaActividad: pendientesDe(f),
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

  /**
   * Intentos de la escalera que muestra la bandeja: sin validar, del nivel
   * ACTUAL del estudiante y, de cada estudiante y actividad, el más reciente.
   * Los de niveles ya superados no cambiarían nada: no se muestran.
   */
  private async escaleraVisible(): Promise<bigint[]> {
    const filas = await this.prisma.$queryRaw<Array<{ id: bigint }>>`
      select i.id
        from public.intento i
        join public.actividad a on a.id = i.actividad_id
        join public.nivel_juego_estudiante n
          on n.estudiante_id = i.estudiante_id and n.tipo_juego_id = a.tipo_juego_id
       where i.asignacion_id is null
         and a.nivel_juego = n.nivel_actual
         and not exists (select 1 from public.validacion v where v.intento_id = i.id)
         and not exists (
           select 1 from public.intento j
            where j.estudiante_id = i.estudiante_id
              and j.actividad_id = i.actividad_id
              and j.asignacion_id is null
              and j.id > i.id
              and not exists (select 1 from public.validacion w where w.intento_id = j.id))`;
    return filas.map((f) => f.id);
  }

  // ─── Validaciones ─────────────────────────────────────────────────────────

  async validar(
    intentoId: bigint,
    validadorId: bigint,
    decision: DecisionValidacion,
  ): Promise<SubidaNivel | null> {
    // Triggers: rol (DIRECTORA/TALLERISTA), vínculo con el estudiante y
    // recálculo del progreso (aviso AVANCE a los acudientes al completar).
    // Si es de la escalera y se aprueba, sube de nivel en la misma transacción.
    return this.prisma.$transaction(async (tx) => {
      await tx.validacion.create({
        data: {
          intento_id: intentoId,
          validador_id: validadorId,
          resultado: decision.resultado,
          retroalimentacion: decision.retroalimentacion,
        },
      });
      return decision.resultado === 'APROBADO'
        ? subirSiCorresponde(tx, intentoId, validadorId)
        : null;
    }, OPCIONES_TRANSACCION);
  }

  async aprobarLote(
    intentoIds: bigint[],
    validadorId: bigint,
  ): Promise<ResultadoLote> {
    return this.prisma.$transaction(async (tx) => {
      // Una sola sentencia: si una fila falla (p. ej., ya validada), no queda
      // ninguna. Los triggers corren por cada fila.
      const { count } = await tx.validacion.createMany({
        data: intentoIds.map((intentoId) => ({
          intento_id: intentoId,
          validador_id: validadorId,
          resultado: 'APROBADO',
        })),
      });
      // Subidas en orden: cada intento se compara con el nivel YA actualizado,
      // así dos del mismo nivel suben uno solo y nunca se salta un nivel.
      const deEscalera = await tx.intento.findMany({
        where: { id: { in: intentoIds }, asignacion_id: null },
        select: { id: true },
        orderBy: [{ fecha: 'asc' }, { id: 'asc' }],
      });
      const subidas: SubidaNivel[] = [];
      for (const { id } of deEscalera) {
        const subida = await subirSiCorresponde(tx, id, validadorId);
        if (subida) subidas.push(subida);
      }
      return { aprobados: count, subidas };
    }, OPCIONES_TRANSACCION);
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
