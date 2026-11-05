import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ALMACEN_ARCHIVOS,
  type AlmacenArchivos,
  type ArchivoSubido,
  type UrlFirmada,
} from '../../../common/almacenamiento/almacen-archivos.js';
import {
  confirmarTipo,
  EXTENSION,
} from '../../../common/almacenamiento/tipos-archivo.js';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import {
  ConflictoError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../../../common/errors/dominio.errors.js';
import {
  FORMATOS_POR_TIPO,
  type Contenido,
  type TipoContenido,
} from '../domain/modulo.entity.js';
import {
  CONTENIDO_REPOSITORY,
  type ContenidoRepository,
} from '../domain/modulo.repository.js';
import { AccesoModuloService } from './acceso-modulo.service.js';

/** Duración de las URLs firmadas de contenidos (no son datos de menores). */
export const DURACION_URL_CONTENIDO_SEG = 60 * 60;

export interface ContenidoConUrl {
  contenidoId: bigint;
  url: UrlFirmada;
}

const NO_EXISTE = 'El contenido no existe.';

/** Videos, imágenes, audios y animaciones de un módulo (bucket `contenidos`). */
@Injectable()
export class ContenidoService {
  private readonly logger = new Logger(ContenidoService.name);

  constructor(
    @Inject(CONTENIDO_REPOSITORY)
    private readonly contenidos: ContenidoRepository,
    @Inject(ALMACEN_ARCHIVOS) private readonly almacen: AlmacenArchivos,
    private readonly acceso: AccesoModuloService,
  ) {}

  async listar(
    actual: UsuarioAutenticado,
    moduloId: bigint,
  ): Promise<Contenido[]> {
    await this.acceso.ver(actual, moduloId);
    return this.contenidos.listar(moduloId);
  }

  /**
   * Sube el archivo a Storage y registra el contenido. El tipo real se
   * comprueba por los bytes del archivo, no por lo que declara el cliente.
   */
  async subir(
    actual: UsuarioAutenticado,
    moduloId: bigint,
    datos: { tipo: TipoContenido; titulo: string; orden: number },
    archivo: ArchivoSubido,
  ): Promise<Contenido> {
    await this.acceso.editar(actual, moduloId);
    const titulo = datos.titulo.trim();
    if (!titulo) throw new ReglaNegocioError('El título es obligatorio.');

    const formato = confirmarTipo(archivo.cabecera, archivo.mimetype);
    if (!formato) {
      throw new ReglaNegocioError(
        'El archivo no es válido o su formato no coincide con su contenido.',
      );
    }
    if (!FORMATOS_POR_TIPO[datos.tipo].includes(formato)) {
      throw new ReglaNegocioError(
        `Un contenido ${datos.tipo} debe ser: ${FORMATOS_POR_TIPO[datos.tipo].join(', ')}.`,
      );
    }

    const ruta = `modulo/${moduloId}/contenido/${randomUUID()}.${EXTENSION[formato]}`;
    await this.almacen.subir('contenidos', ruta, archivo.path, formato);
    try {
      return await this.contenidos.crear({
        moduloId,
        tipo: datos.tipo,
        titulo,
        ruta,
        orden: datos.orden,
      });
    } catch (error) {
      // Compensación: sin registro, el archivo no debe quedar en Storage.
      await this.almacen.eliminar('contenidos', [ruta]).catch(() => {
        this.logger.warn(
          `Quedó un archivo sin registro en el módulo ${moduloId}`,
        );
      });
      throw error;
    }
  }

  async actualizar(
    actual: UsuarioAutenticado,
    id: bigint,
    cambios: { titulo: string | null; orden: number | null },
  ): Promise<Contenido> {
    const contenido = await this.existente(id);
    await this.acceso.editar(actual, contenido.moduloId);
    const titulo = cambios.titulo === null ? null : cambios.titulo.trim();
    if (titulo === '') throw new ReglaNegocioError('El título es obligatorio.');
    return this.contenidos.actualizar(id, { titulo, orden: cambios.orden });
  }

  /** No se borra si una actividad lo usa o es la portada (409). */
  async eliminar(actual: UsuarioAutenticado, id: bigint): Promise<void> {
    const contenido = await this.existente(id);
    await this.acceso.editar(actual, contenido.moduloId);
    if (await this.contenidos.estaEnUso(contenido)) {
      throw new ConflictoError(
        'El contenido está en uso (en una actividad o como portada). Quítalo de ahí primero.',
      );
    }
    await this.contenidos.eliminar(id);
    await this.almacen.eliminar('contenidos', [contenido.ruta]).catch(() => {
      this.logger.warn(
        `Quedó un archivo sin registro en el módulo ${contenido.moduloId}`,
      );
    });
  }

  /** URL firmada de un contenido (60 min). Estudiante y acudiente: solo si el módulo está asignado. */
  async url(actual: UsuarioAutenticado, id: bigint): Promise<UrlFirmada> {
    const contenido = await this.existente(id);
    // Si no puede ver el módulo, el contenido "no existe".
    await this.acceso
      .ver(actual, contenido.moduloId)
      .catch((error: unknown) => {
        throw error instanceof RecursoNoEncontradoError
          ? new RecursoNoEncontradoError(NO_EXISTE)
          : error;
      });
    const firmadas = await this.almacen.urlsFirmadas(
      'contenidos',
      [contenido.ruta],
      DURACION_URL_CONTENIDO_SEG,
    );
    const url = firmadas.get(contenido.ruta);
    if (!url)
      throw new RecursoNoEncontradoError(
        'El archivo del contenido no está disponible.',
      );
    return url;
  }

  /** Todas las URLs firmadas de un módulo en una sola llamada (para cargar un juego). */
  async urlsDelModulo(
    actual: UsuarioAutenticado,
    moduloId: bigint,
  ): Promise<ContenidoConUrl[]> {
    await this.acceso.ver(actual, moduloId);
    const contenidos = await this.contenidos.listar(moduloId);
    const firmadas = await this.almacen.urlsFirmadas(
      'contenidos',
      contenidos.map((c) => c.ruta),
      DURACION_URL_CONTENIDO_SEG,
    );
    return contenidos.flatMap((c) => {
      const url = firmadas.get(c.ruta);
      return url ? [{ contenidoId: c.id, url }] : [];
    });
  }

  private async existente(id: bigint): Promise<Contenido> {
    const contenido = await this.contenidos.buscarPorId(id);
    if (!contenido) throw new RecursoNoEncontradoError(NO_EXISTE);
    return contenido;
  }
}
