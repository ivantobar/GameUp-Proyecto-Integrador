import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { Actividad, ElementoActividad } from '../domain/modulo.entity.js';
import type {
  ActividadRepository,
  CambiosActividad,
  DatosActividad,
} from '../domain/modulo.repository.js';
import { ModuloMapper, SELECCION_ACTIVIDAD } from './modulo.mapper.js';

/*
 * actividad_contenido guarda RUTAS en url_imagen, url_kinema y url_audio.
 * Hacia el dominio se traducen a ids de contenidos del mismo módulo, y de
 * vuelta al escribir. Así la API nunca recibe ni entrega rutas.
 */

/** url_imagen es obligatoria; el servicio ya validó la referencia. */
function rutaObligatoria(ruta: string | null): string {
  if (ruta === null)
    throw new Error('Elemento sin imagen: el servicio debió rechazarlo');
  return ruta;
}

@Injectable()
export class PrismaActividadRepository implements ActividadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listar(moduloId: bigint, soloActivas: boolean): Promise<Actividad[]> {
    const filas = await this.prisma.actividad.findMany({
      where: { modulo_id: moduloId, ...(soloActivas ? { activa: true } : {}) },
      select: SELECCION_ACTIVIDAD,
      orderBy: [{ orden: 'asc' }, { id: 'asc' }],
    });
    return filas.map(ModuloMapper.aActividad);
  }

  async buscarPorId(id: bigint): Promise<Actividad | null> {
    const fila = await this.prisma.actividad.findUnique({
      where: { id },
      select: SELECCION_ACTIVIDAD,
    });
    return fila ? ModuloMapper.aActividad(fila) : null;
  }

  async elementos(actividadId: bigint): Promise<ElementoActividad[]> {
    const actividad = await this.prisma.actividad.findUnique({
      where: { id: actividadId },
      select: {
        modulo: {
          select: { contenido: { select: { id: true, url_recurso: true } } },
        },
        actividad_contenido: {
          orderBy: [{ orden: 'asc' }, { contenido_id: 'asc' }],
        },
      },
    });
    if (!actividad) return [];
    const idPorRuta = new Map(
      actividad.modulo.contenido.map((c) => [c.url_recurso, c.id]),
    );
    const id = (ruta: string | null) =>
      ruta === null ? null : (idPorRuta.get(ruta) ?? null);
    return actividad.actividad_contenido.map((f) => ({
      contenidoId: f.contenido_id,
      rolEnJuego: f.rol_en_juego,
      orden: f.orden,
      palabra: f.palabra,
      imagenContenidoId: id(f.url_imagen),
      kinemaContenidoId: id(f.url_kinema),
      audioContenidoId: id(f.url_audio),
    }));
  }

  async crear(moduloId: bigint, datos: DatosActividad): Promise<Actividad> {
    const fila = await this.prisma.actividad.create({
      data: {
        modulo_id: moduloId,
        tipo_juego_id: datos.tipoJuegoId,
        titulo: datos.titulo,
        instruccion_texto: datos.instruccionTexto,
        configuracion: datos.configuracion as Prisma.InputJsonObject,
        orden: datos.orden,
        activa: datos.activa,
      },
      select: SELECCION_ACTIVIDAD,
    });
    return ModuloMapper.aActividad(fila);
  }

  async actualizar(id: bigint, cambios: CambiosActividad): Promise<Actividad> {
    const data: Prisma.actividadUncheckedUpdateInput = {};
    if (cambios.titulo !== null) data.titulo = cambios.titulo;
    if (cambios.orden !== null) data.orden = cambios.orden;
    if (cambios.activa !== null) data.activa = cambios.activa;
    if (cambios.configuracion !== null) {
      data.configuracion = cambios.configuracion as Prisma.InputJsonObject;
    }
    if (cambios.instruccionTexto !== null) {
      data.instruccion_texto =
        cambios.instruccionTexto === 'borrar' ? null : cambios.instruccionTexto;
    }
    // Cambiar `activa` dispara trg_actividad_recalcular (progreso de las asignaciones).
    const fila = await this.prisma.actividad.update({
      where: { id },
      data,
      select: SELECCION_ACTIVIDAD,
    });
    return ModuloMapper.aActividad(fila);
  }

  async eliminar(id: bigint): Promise<void> {
    await this.prisma.actividad.delete({ where: { id } });
  }

  async tieneIntentos(id: bigint): Promise<boolean> {
    return (
      (await this.prisma.intento.count({ where: { actividad_id: id } })) > 0
    );
  }

  async reemplazarElementos(
    actividadId: bigint,
    elementos: ElementoActividad[],
  ): Promise<ElementoActividad[]> {
    await this.prisma.$transaction(async (tx) => {
      const { modulo_id } = await tx.actividad.findUniqueOrThrow({
        where: { id: actividadId },
        select: { modulo_id: true },
      });
      const contenidos = await tx.contenido.findMany({
        where: { modulo_id },
        select: { id: true, url_recurso: true },
      });
      const rutaPorId = new Map(contenidos.map((c) => [c.id, c.url_recurso]));
      const ruta = (id: bigint | null) =>
        id === null ? null : (rutaPorId.get(id) ?? null);

      await tx.actividad_contenido.deleteMany({
        where: { actividad_id: actividadId },
      });
      if (elementos.length === 0) return;
      // trg_act_cont_modulo vuelve a comprobar que actividad y contenido sean del mismo módulo.
      await tx.actividad_contenido.createMany({
        data: elementos.map((e) => ({
          actividad_id: actividadId,
          contenido_id: e.contenidoId,
          rol_en_juego: e.rolEnJuego,
          orden: e.orden,
          palabra: e.palabra,
          url_imagen: rutaObligatoria(ruta(e.imagenContenidoId)),
          url_kinema: ruta(e.kinemaContenidoId),
          url_audio: ruta(e.audioContenidoId),
        })),
      });
    });
    return this.elementos(actividadId);
  }
}
