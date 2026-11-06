import { Injectable } from '@nestjs/common';
import { idATexto } from '../../../common/ids/ids.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  esCodigoJuego,
  type Configuracion,
} from '../../catalogo/domain/juegos/estrategia-juego.js';
import type { Intento } from '../domain/intento.entity.js';
import type {
  IntentoEscrituraRepository,
  IntentoLecturaRepository,
  NuevaGrabacion,
  NuevoIntento,
} from '../domain/intento.repository.js';

const SELECCION_INTENTO = {
  id: true,
  asignacion_id: true,
  actividad_id: true,
  estudiante_id: true,
  numero_intento: true,
  resultado: true,
  estrellas: true,
  fecha: true,
  actividad: {
    select: { nivel_juego: true, tipo_juego: { select: { codigo: true } } },
  },
  validacion: {
    select: { resultado: true, retroalimentacion: true, fecha: true },
  },
  grabacion_estudiante: { select: { id: true, eliminada_en: true } },
} satisfies Prisma.intentoSelect;

type FilaIntento = Prisma.intentoGetPayload<{
  select: typeof SELECCION_INTENTO;
}>;

export function filaAIntento(f: FilaIntento): Intento {
  const codigo = f.actividad.tipo_juego.codigo;
  if (!esCodigoJuego(codigo)) throw new Error('Tipo de juego desconocido');
  const v = f.validacion;
  return {
    id: f.id,
    asignacionId: f.asignacion_id,
    actividadId: f.actividad_id,
    estudianteId: f.estudiante_id,
    tipoJuego: codigo,
    nivelJuego: f.actividad.nivel_juego,
    numeroIntento: f.numero_intento,
    // intento.resultado siempre es un objeto JSON (lo escribe el backend).
    resultado: (f.resultado ?? {}) as Configuracion,
    estrellas: f.estrellas,
    fecha: f.fecha,
    validacion: v
      ? {
          resultado: v.resultado as 'APROBADO' | 'RECHAZADO',
          retroalimentacion: v.retroalimentacion,
          fecha: v.fecha,
        }
      : null,
    grabacion: f.grabacion_estudiante
      ? {
          id: f.grabacion_estudiante.id,
          eliminadaEn: f.grabacion_estudiante.eliminada_en,
        }
      : null,
  };
}

/** Filtro: intentos de Habla conmigo de un estudiante. */
const deHablaConmigo = (estudianteId: bigint): Prisma.intentoWhereInput => ({
  estudiante_id: estudianteId,
  actividad: { tipo_juego: { codigo: 'HABLA_CONMIGO' } },
});

@Injectable()
export class PrismaIntentoRepository
  implements IntentoEscrituraRepository, IntentoLecturaRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async registrar(datos: NuevoIntento): Promise<Intento> {
    // INSERT sin numero_intento: el trigger fn_intento_antes lo calcula ANTES
    // del chequeo NOT NULL (Prisma lo exige como obligatorio, por eso SQL).
    // El mismo trigger valida módulo y asignación no completada (o, sin
    // asignación, que sea del nivel actual de la escalera) y que el estudiante
    // coincida; fn_intento_despues pasa la asignación a EN_CURSO.
    const [fila] = await this.prisma.$queryRaw<Array<{ id: bigint }>>`
      insert into public.intento (asignacion_id, estudiante_id, actividad_id, resultado, estrellas)
      values (${datos.asignacionId}::bigint, ${datos.estudianteId}::bigint, ${datos.actividadId}::bigint,
              ${JSON.stringify(datos.resultado)}::jsonb, ${datos.estrellas}::int)
      returning id`;
    if (!fila) throw new Error('La base no devolvió el intento creado');
    const intento = await this.buscarPorId(fila.id);
    if (!intento)
      throw new Error(`No se encontró el intento ${idATexto(fila.id)}`);
    return intento;
  }

  async actualizarResultado(
    id: bigint,
    resultado: Configuracion,
  ): Promise<void> {
    await this.prisma.intento.update({
      where: { id },
      data: { resultado: resultado as Prisma.InputJsonObject },
    });
  }

  async registrarGrabacion(datos: NuevaGrabacion): Promise<void> {
    await this.prisma.grabacion_estudiante.create({
      data: {
        intento_id: datos.intentoId,
        ruta_audio: datos.ruta,
        duracion_seg: datos.duracionSeg,
        codigo_version_terminos: datos.codigoVersionTerminos,
        consentimiento_verificado_en: datos.consentimientoVerificadoEn,
      },
    });
  }

  async buscarPorId(id: bigint): Promise<Intento | null> {
    const fila = await this.prisma.intento.findUnique({
      where: { id },
      select: SELECCION_INTENTO,
    });
    return fila ? filaAIntento(fila) : null;
  }

  async intentosPorVocal(estudianteId: bigint): Promise<Map<string, number>> {
    const filas = await this.prisma.intento.findMany({
      where: deHablaConmigo(estudianteId),
      select: { actividad: { select: { configuracion: true } } },
    });
    const conteo = new Map<string, number>();
    for (const f of filas) {
      const vocal = (f.actividad.configuracion as Configuracion)['vocal'];
      if (typeof vocal === 'string')
        conteo.set(vocal, (conteo.get(vocal) ?? 0) + 1);
    }
    return conteo;
  }

  async ultimaVocal(estudianteId: bigint): Promise<string | null> {
    const fila = await this.prisma.intento.findFirst({
      where: deHablaConmigo(estudianteId),
      orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
      select: { actividad: { select: { configuracion: true } } },
    });
    const vocal = (
      fila?.actividad.configuracion as Configuracion | undefined
    )?.['vocal'];
    return typeof vocal === 'string' ? vocal : null;
  }
}
