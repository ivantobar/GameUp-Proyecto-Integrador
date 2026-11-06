import type { UrlFirmada } from '../../../common/almacenamiento/almacen-archivos.js';
import { idATexto } from '../../../common/ids/ids.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import {
  esCodigoJuego,
  type Configuracion,
} from '../../catalogo/domain/juegos/estrategia-juego.js';
import {
  nombreVisiblePersona,
  SELECCION_PERSONA,
} from '../../estudiantes/infrastructure/estudiante.mapper.js';
import type { ContenidoConUrl } from '../application/contenido.service.js';
import {
  Modulo,
  TIPOS_CONTENIDO,
  type Actividad,
  type Contenido,
  type ElementoActividad,
  type TipoContenido,
} from '../domain/modulo.entity.js';
import type {
  ActividadDto,
  ContenidoDto,
  ContenidoUrlDto,
  ElementoActividadDto,
  ModuloDto,
  UrlFirmadaDto,
} from '../presentation/dto/modulo.dto.js';

export const SELECCION_MODULO = {
  id: true,
  nombre: true,
  descripcion: true,
  portada_url: true,
  publicado: true,
  orden: true,
  creado_en: true,
  musica_id: true,
  categoria: { select: { id: true, nombre: true } },
  nivel: { select: { id: true, nombre: true } },
  usuario: { select: SELECCION_PERSONA },
} satisfies Prisma.moduloSelect;

export type FilaModulo = Prisma.moduloGetPayload<{
  select: typeof SELECCION_MODULO;
}>;

export const SELECCION_CONTENIDO = {
  id: true,
  modulo_id: true,
  tipo: true,
  titulo: true,
  url_recurso: true,
  orden: true,
} satisfies Prisma.contenidoSelect;

export type FilaContenido = Prisma.contenidoGetPayload<{
  select: typeof SELECCION_CONTENIDO;
}>;

export const SELECCION_ACTIVIDAD = {
  id: true,
  modulo_id: true,
  titulo: true,
  instruccion_texto: true,
  configuracion: true,
  orden: true,
  activa: true,
  nivel_juego: true,
  tipo_juego: { select: { id: true, codigo: true, nombre: true } },
} satisfies Prisma.actividadSelect;

export type FilaActividad = Prisma.actividadGetPayload<{
  select: typeof SELECCION_ACTIVIDAD;
}>;

const texto = (id: bigint | null) => (id === null ? null : idATexto(id));

function urlADto(u: UrlFirmada): UrlFirmadaDto {
  return { url: u.url, expiraEn: u.expiraEn.toISOString() };
}

export const ModuloMapper = {
  // ─── Prisma → dominio ─────────────────────────────────────────────────────

  aModulo(f: FilaModulo, portadaContenidoId: bigint | null): Modulo {
    return new Modulo({
      id: f.id,
      categoria: f.categoria,
      nivel: f.nivel,
      creadoPor: f.usuario,
      musicaId: f.musica_id,
      nombre: f.nombre,
      descripcion: f.descripcion,
      portadaContenidoId,
      publicado: f.publicado,
      orden: f.orden,
      creadoEn: f.creado_en,
    });
  },

  aContenido(f: FilaContenido): Contenido {
    // contenido_tipo_check lo garantiza.
    if (!(TIPOS_CONTENIDO as readonly string[]).includes(f.tipo)) {
      throw new Error('Tipo de contenido desconocido');
    }
    return {
      id: f.id,
      moduloId: f.modulo_id,
      tipo: f.tipo as TipoContenido,
      titulo: f.titulo,
      ruta: f.url_recurso,
      orden: f.orden,
    };
  },

  aActividad(f: FilaActividad): Actividad {
    if (!esCodigoJuego(f.tipo_juego.codigo)) {
      throw new Error('Tipo de juego desconocido');
    }
    // actividad_configuracion_check garantiza que es un objeto JSON.
    const configuracion = f.configuracion as Configuracion;
    return {
      id: f.id,
      moduloId: f.modulo_id,
      tipoJuego: { ...f.tipo_juego, codigo: f.tipo_juego.codigo },
      titulo: f.titulo,
      instruccionTexto: f.instruccion_texto,
      configuracion,
      orden: f.orden,
      activa: f.activa,
      nivelJuego: f.nivel_juego,
    };
  },

  // ─── Dominio → DTO ────────────────────────────────────────────────────────

  aModuloDto(m: Modulo): ModuloDto {
    return {
      id: idATexto(m.id),
      nombre: m.nombre,
      descripcion: m.descripcion,
      categoria: { id: idATexto(m.categoria.id), nombre: m.categoria.nombre },
      nivel: { id: idATexto(m.nivel.id), nombre: m.nivel.nombre },
      creadoPor: {
        id: idATexto(m.creadoPor.id),
        displayName: nombreVisiblePersona(m.creadoPor),
      },
      musicaId: texto(m.musicaId),
      portadaContenidoId: texto(m.portadaContenidoId),
      publicado: m.publicado,
      orden: m.orden,
      creadoEn: m.creadoEn.toISOString(),
    };
  },

  /** Sin la ruta de Storage: el archivo se pide con una URL firmada. */
  aContenidoDto(c: Contenido): ContenidoDto {
    return {
      id: idATexto(c.id),
      moduloId: idATexto(c.moduloId),
      tipo: c.tipo,
      titulo: c.titulo,
      orden: c.orden,
    };
  },

  aUrlDto: urlADto,

  aContenidoUrlDto(c: ContenidoConUrl): ContenidoUrlDto {
    return { contenidoId: idATexto(c.contenidoId), ...urlADto(c.url) };
  },

  aActividadDto(a: Actividad): ActividadDto {
    return {
      id: idATexto(a.id),
      moduloId: idATexto(a.moduloId),
      tipoJuego: {
        id: idATexto(a.tipoJuego.id),
        codigo: a.tipoJuego.codigo,
        nombre: a.tipoJuego.nombre,
      },
      titulo: a.titulo,
      instruccionTexto: a.instruccionTexto,
      configuracion: a.configuracion,
      orden: a.orden,
      activa: a.activa,
      nivelJuego: a.nivelJuego,
    };
  },

  aElementoDto(e: ElementoActividad): ElementoActividadDto {
    return {
      contenidoId: idATexto(e.contenidoId),
      rolEnJuego: e.rolEnJuego,
      orden: e.orden,
      palabra: e.palabra,
      imagenContenidoId: texto(e.imagenContenidoId),
      kinemaContenidoId: texto(e.kinemaContenidoId),
      audioContenidoId: texto(e.audioContenidoId),
    };
  },
} as const;
