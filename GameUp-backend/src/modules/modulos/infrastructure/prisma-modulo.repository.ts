import { Injectable } from '@nestjs/common';
import {
  saltar,
  type Pagina,
  type Paginacion,
} from '../../../common/paginacion/paginacion.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { AlcanceEstudiantes } from '../../estudiantes/domain/alcance.js';
import type { Contenido, Modulo } from '../domain/modulo.entity.js';
import type {
  CambiosModulo,
  ContenidoRepository,
  DatosModulo,
  FiltroModulos,
  ModuloRepository,
  VisibilidadModulos,
} from '../domain/modulo.repository.js';
import {
  ModuloMapper,
  SELECCION_CONTENIDO,
  SELECCION_MODULO,
  type FilaModulo,
} from './modulo.mapper.js';

@Injectable()
export class PrismaModuloRepository implements ModuloRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: bigint): Promise<Modulo | null> {
    const fila = await this.prisma.modulo.findUnique({
      where: { id },
      select: SELECCION_MODULO,
    });
    return fila ? ((await this.conPortadas([fila]))[0] ?? null) : null;
  }

  async listar(
    visibilidad: VisibilidadModulos,
    filtro: FiltroModulos,
    paginacion: Paginacion,
  ): Promise<Pagina<Modulo>> {
    const condiciones: Prisma.moduloWhereInput[] = [];
    if (visibilidad.tipo === 'tallerista') {
      condiciones.push({
        OR: [{ publicado: true }, { creado_por: visibilidad.talleristaId }],
      });
    }
    if (filtro.categoriaId !== null)
      condiciones.push({ categoria_id: filtro.categoriaId });
    if (filtro.nivelId !== null) condiciones.push({ nivel_id: filtro.nivelId });
    if (filtro.publicado !== null)
      condiciones.push({ publicado: filtro.publicado });
    const where: Prisma.moduloWhereInput = { AND: condiciones };

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.modulo.findMany({
        where,
        select: SELECCION_MODULO,
        orderBy: [{ orden: 'asc' }, { nombre: 'asc' }, { id: 'asc' }],
        skip: saltar(paginacion),
        take: paginacion.limit,
      }),
      this.prisma.modulo.count({ where }),
    ]);
    return { items: await this.conPortadas(filas), total, ...paginacion };
  }

  async crear(datos: DatosModulo, creadoPor: bigint): Promise<Modulo> {
    // El trigger trg_rol_modulo exige que creado_por sea DIRECTORA o TALLERISTA.
    const fila = await this.prisma.modulo.create({
      data: {
        categoria_id: datos.categoriaId,
        nivel_id: datos.nivelId,
        creado_por: creadoPor,
        musica_id: datos.musicaId,
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        orden: datos.orden,
      },
      select: SELECCION_MODULO,
    });
    return ModuloMapper.aModulo(fila, null);
  }

  async actualizar(id: bigint, cambios: CambiosModulo): Promise<Modulo> {
    const data: Prisma.moduloUncheckedUpdateInput = {};
    if (cambios.categoriaId !== null) data.categoria_id = cambios.categoriaId;
    if (cambios.nivelId !== null) data.nivel_id = cambios.nivelId;
    if (cambios.nombre !== null) data.nombre = cambios.nombre;
    if (cambios.orden !== null) data.orden = cambios.orden;
    if (cambios.musicaId !== null) {
      data.musica_id = cambios.musicaId === 'borrar' ? null : cambios.musicaId;
    }
    if (cambios.descripcion !== null) {
      data.descripcion =
        cambios.descripcion === 'borrar' ? null : cambios.descripcion;
    }
    if (cambios.portadaContenidoId === 'borrar') {
      data.portada_url = null;
    } else if (cambios.portadaContenidoId !== null) {
      // Se guarda la ruta del contenido (el servicio ya validó que es del módulo).
      const portada = await this.prisma.contenido.findUniqueOrThrow({
        where: { id: cambios.portadaContenidoId },
        select: { url_recurso: true },
      });
      data.portada_url = portada.url_recurso;
    }
    const fila = await this.prisma.modulo.update({
      where: { id },
      data,
      select: SELECCION_MODULO,
    });
    return (await this.conPortadas([fila]))[0] as Modulo;
  }

  async cambiarPublicado(id: bigint, publicado: boolean): Promise<Modulo> {
    const fila = await this.prisma.modulo.update({
      where: { id },
      data: { publicado },
      select: SELECCION_MODULO,
    });
    return (await this.conPortadas([fila]))[0] as Modulo;
  }

  async eliminar(id: bigint): Promise<void> {
    await this.prisma.modulo.delete({ where: { id } });
  }

  async tieneAsignaciones(id: bigint): Promise<boolean> {
    return (
      (await this.prisma.asignacion.count({ where: { modulo_id: id } })) > 0
    );
  }

  contarActividadesActivas(id: bigint): Promise<number> {
    return this.prisma.actividad.count({
      where: { modulo_id: id, activa: true },
    });
  }

  async asignadoEnAlcance(
    alcance: AlcanceEstudiantes,
    moduloId: bigint,
  ): Promise<boolean> {
    let estudiante: Prisma.asignacionWhereInput = {};
    switch (alcance.tipo) {
      case 'todos':
        break;
      case 'propio':
        estudiante = { estudiante_id: alcance.estudianteId };
        break;
      case 'tallerista':
        estudiante = {
          estudiante: {
            tallerista_estudiante: {
              some: { tallerista_id: alcance.talleristaId, activo: true },
            },
          },
        };
        break;
      case 'acudiente': {
        // Ver la nota sobre acudiente_estudiante en prisma-estudiante.repository.ts.
        const vinculos = await this.prisma.acudiente_estudiante.findMany({
          where: { acudiente_id: alcance.acudienteId },
          select: { estudiante_id: true },
        });
        estudiante = {
          estudiante_id: { in: vinculos.map((v) => v.estudiante_id) },
        };
        break;
      }
    }
    return (
      (await this.prisma.asignacion.count({
        where: { modulo_id: moduloId, ...estudiante },
      })) > 0
    );
  }

  /** portada_url guarda una ruta: se traduce al id del contenido del mismo módulo. */
  private async conPortadas(filas: FilaModulo[]): Promise<Modulo[]> {
    const rutas = filas
      .map((f) => f.portada_url)
      .filter((r): r is string => r !== null);
    const contenidos =
      rutas.length === 0
        ? []
        : await this.prisma.contenido.findMany({
            where: { url_recurso: { in: rutas } },
            select: { id: true, modulo_id: true, url_recurso: true },
          });
    const porRuta = new Map(
      contenidos.map((c) => [`${c.modulo_id}|${c.url_recurso}`, c.id]),
    );
    return filas.map((f) =>
      ModuloMapper.aModulo(
        f,
        f.portada_url
          ? (porRuta.get(`${f.id}|${f.portada_url}`) ?? null)
          : null,
      ),
    );
  }
}

@Injectable()
export class PrismaContenidoRepository implements ContenidoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listar(moduloId: bigint): Promise<Contenido[]> {
    const filas = await this.prisma.contenido.findMany({
      where: { modulo_id: moduloId },
      select: SELECCION_CONTENIDO,
      orderBy: [{ orden: 'asc' }, { id: 'asc' }],
    });
    return filas.map(ModuloMapper.aContenido);
  }

  async buscarPorId(id: bigint): Promise<Contenido | null> {
    const fila = await this.prisma.contenido.findUnique({
      where: { id },
      select: SELECCION_CONTENIDO,
    });
    return fila ? ModuloMapper.aContenido(fila) : null;
  }

  async crear(datos: {
    moduloId: bigint;
    tipo: Contenido['tipo'];
    titulo: string;
    ruta: string;
    orden: number;
  }): Promise<Contenido> {
    const fila = await this.prisma.contenido.create({
      data: {
        modulo_id: datos.moduloId,
        tipo: datos.tipo,
        titulo: datos.titulo,
        url_recurso: datos.ruta,
        orden: datos.orden,
      },
      select: SELECCION_CONTENIDO,
    });
    return ModuloMapper.aContenido(fila);
  }

  async actualizar(
    id: bigint,
    cambios: { titulo: string | null; orden: number | null },
  ): Promise<Contenido> {
    const data: Prisma.contenidoUpdateInput = {};
    if (cambios.titulo !== null) data.titulo = cambios.titulo;
    if (cambios.orden !== null) data.orden = cambios.orden;
    const fila = await this.prisma.contenido.update({
      where: { id },
      data,
      select: SELECCION_CONTENIDO,
    });
    return ModuloMapper.aContenido(fila);
  }

  async eliminar(id: bigint): Promise<void> {
    await this.prisma.contenido.delete({ where: { id } });
  }

  async estaEnUso(contenido: Contenido): Promise<boolean> {
    const [enActividades, comoPortada] = await this.prisma.$transaction([
      this.prisma.actividad_contenido.count({
        where: {
          OR: [
            { contenido_id: contenido.id },
            { url_imagen: contenido.ruta },
            { url_kinema: contenido.ruta },
            { url_audio: contenido.ruta },
          ],
        },
      }),
      this.prisma.modulo.count({
        where: { id: contenido.moduloId, portada_url: contenido.ruta },
      }),
    ]);
    return enActividades + comoPortada > 0;
  }
}
