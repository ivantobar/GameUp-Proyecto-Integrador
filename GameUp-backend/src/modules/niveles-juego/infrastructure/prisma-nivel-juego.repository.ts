import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  JUEGOS_CON_ESCALERA,
  esJuegoConEscalera,
  type JuegoConEscalera,
} from '../../catalogo/domain/juegos/niveles-juego.js';
import type { CambioNivel, NivelJuego } from '../domain/nivel-juego.js';
import type { NivelJuegoRepository } from '../domain/nivel-juego.repository.js';

const SELECCION_NIVEL = {
  estudiante_id: true,
  nivel_actual: true,
  completado: true,
  actualizado_en: true,
  tipo_juego: { select: { codigo: true, nombre: true } },
} as const;

interface FilaNivel {
  estudiante_id: bigint;
  nivel_actual: number;
  completado: boolean;
  actualizado_en: Date;
  tipo_juego: { codigo: string; nombre: string };
}

function aNivel(f: FilaNivel): NivelJuego | null {
  if (!esJuegoConEscalera(f.tipo_juego.codigo)) return null;
  return {
    estudianteId: f.estudiante_id,
    juego: f.tipo_juego.codigo,
    nombreJuego: f.tipo_juego.nombre,
    nivelActual: f.nivel_actual,
    completado: f.completado,
    actualizadoEn: f.actualizado_en,
  };
}

/** Orden fijo de los juegos (como en la app). */
const orden = (j: JuegoConEscalera) => JUEGOS_CON_ESCALERA.indexOf(j);

@Injectable()
export class PrismaNivelJuegoRepository implements NivelJuegoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async delEstudiante(estudianteId: bigint): Promise<NivelJuego[]> {
    const filas = await this.prisma.nivel_juego_estudiante.findMany({
      where: { estudiante_id: estudianteId },
      select: SELECCION_NIVEL,
    });
    return filas
      .map(aNivel)
      .filter((n): n is NivelJuego => n !== null)
      .sort((a, b) => orden(a.juego) - orden(b.juego));
  }

  async pendientesPorJuego(
    estudianteId: bigint,
  ): Promise<Map<JuegoConEscalera, number>> {
    const filas = await this.prisma.$queryRaw<
      Array<{ codigo: string; pendientes: bigint }>
    >`
      select tj.codigo, count(*) as pendientes
        from public.intento i
        join public.actividad a on a.id = i.actividad_id
        join public.tipo_juego tj on tj.id = a.tipo_juego_id
        join public.nivel_juego_estudiante n
          on n.estudiante_id = i.estudiante_id and n.tipo_juego_id = a.tipo_juego_id
       where i.estudiante_id = ${estudianteId}::bigint
         and i.asignacion_id is null
         and a.nivel_juego = n.nivel_actual
         and not exists (select 1 from public.validacion v where v.intento_id = i.id)
       group by tj.codigo`;
    const resultado = new Map<JuegoConEscalera, number>();
    for (const f of filas) {
      if (esJuegoConEscalera(f.codigo))
        resultado.set(f.codigo, Number(f.pendientes));
    }
    return resultado;
  }

  async actividadDelNivel(
    juego: JuegoConEscalera,
    nivel: number,
  ): Promise<bigint | null> {
    const fila = await this.prisma.actividad.findFirst({
      where: {
        nivel_juego: nivel,
        activa: true,
        tipo_juego: { codigo: juego },
        modulo: { es_escalera: true },
      },
      select: { id: true },
    });
    return fila?.id ?? null;
  }

  async ajustar(
    estudianteId: bigint,
    juego: JuegoConEscalera,
    cambio: CambioNivel,
    cambiadoPor: bigint,
    motivo: string,
  ): Promise<NivelJuego | null> {
    return this.prisma.$transaction(async (tx) => {
      const tipo = await tx.tipo_juego.findUniqueOrThrow({
        where: { codigo: juego },
        select: { id: true },
      });
      const clave = { estudiante_id: estudianteId, tipo_juego_id: tipo.id };
      const { count } = await tx.nivel_juego_estudiante.updateMany({
        where: {
          ...clave,
          nivel_actual: cambio.nivelAnterior,
          completado: cambio.completadoAnterior,
        },
        data: {
          nivel_actual: cambio.nivelNuevo,
          completado: cambio.completado,
          actualizado_en: new Date(),
        },
      });
      if (count === 0) return null;
      // Triggers: solo DIRECTORA o la TALLERISTA a cargo; motivo obligatorio.
      await tx.historial_nivel_juego.create({
        data: {
          ...clave,
          nivel_anterior: cambio.nivelAnterior,
          nivel_nuevo: cambio.nivelNuevo,
          completado: cambio.completado,
          origen: 'AJUSTE',
          cambiado_por: cambiadoPor,
          motivo,
        },
      });
      const fila = await tx.nivel_juego_estudiante.findUniqueOrThrow({
        where: { estudiante_id_tipo_juego_id: clave },
        select: SELECCION_NIVEL,
      });
      return aNivel(fila);
    });
  }
}
