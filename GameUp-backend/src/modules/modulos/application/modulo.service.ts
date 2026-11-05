import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ALMACEN_ARCHIVOS,
  type AlmacenArchivos,
} from '../../../common/almacenamiento/almacen-archivos.js';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import {
  ConflictoError,
  ReglaNegocioError,
} from '../../../common/errors/dominio.errors.js';
import type {
  Pagina,
  Paginacion,
} from '../../../common/paginacion/paginacion.js';
import {
  CATALOGO_REPOSITORY,
  type CatalogoRepository,
} from '../../catalogo/domain/catalogo.js';
import type { Modulo } from '../domain/modulo.entity.js';
import {
  CONTENIDO_REPOSITORY,
  MODULO_REPOSITORY,
  type CambiosModulo,
  type ContenidoRepository,
  type DatosModulo,
  type FiltroModulos,
  type ModuloRepository,
} from '../domain/modulo.repository.js';
import { AccesoModuloService } from './acceso-modulo.service.js';

/** Casos de uso del módulo (raíz del agregado). */
@Injectable()
export class ModuloService {
  private readonly logger = new Logger(ModuloService.name);

  constructor(
    @Inject(MODULO_REPOSITORY) private readonly modulos: ModuloRepository,
    @Inject(CONTENIDO_REPOSITORY)
    private readonly contenidos: ContenidoRepository,
    @Inject(CATALOGO_REPOSITORY) private readonly catalogo: CatalogoRepository,
    @Inject(ALMACEN_ARCHIVOS) private readonly almacen: AlmacenArchivos,
    private readonly acceso: AccesoModuloService,
  ) {}

  listar(
    actual: UsuarioAutenticado,
    filtro: FiltroModulos,
    paginacion: Paginacion,
  ): Promise<Pagina<Modulo>> {
    return this.modulos.listar(
      this.acceso.visibilidadDe(actual),
      filtro,
      paginacion,
    );
  }

  obtener(actual: UsuarioAutenticado, id: bigint): Promise<Modulo> {
    return this.acceso.ver(actual, id);
  }

  /** Directora o tallerista. Nace sin publicar. */
  async crear(actual: UsuarioAutenticado, datos: DatosModulo): Promise<Modulo> {
    await this.validarReferencias(
      datos.categoriaId,
      datos.nivelId,
      datos.musicaId,
    );
    return this.modulos.crear(
      { ...datos, nombre: limpiarNombre(datos.nombre) },
      actual.id,
    );
  }

  async actualizar(
    actual: UsuarioAutenticado,
    id: bigint,
    cambios: CambiosModulo,
  ): Promise<Modulo> {
    await this.acceso.editar(actual, id);
    await this.validarReferencias(
      cambios.categoriaId,
      cambios.nivelId,
      cambios.musicaId === 'borrar' ? null : cambios.musicaId,
    );
    if (
      cambios.portadaContenidoId !== null &&
      cambios.portadaContenidoId !== 'borrar'
    ) {
      const portada = await this.contenidos.buscarPorId(
        cambios.portadaContenidoId,
      );
      if (!portada || portada.moduloId !== id || portada.tipo !== 'IMAGEN') {
        throw new ReglaNegocioError(
          'La portada debe ser un contenido de tipo IMAGEN de este mismo módulo.',
        );
      }
    }
    return this.modulos.actualizar(id, {
      ...cambios,
      nombre: cambios.nombre === null ? null : limpiarNombre(cambios.nombre),
    });
  }

  /**
   * Solo la directora. Un módulo sin actividades activas no se publica: los
   * estudiantes no tendrían nada que hacer y su progreso quedaría en 0.
   */
  async publicar(
    actual: UsuarioAutenticado,
    id: bigint,
    publicado: boolean,
  ): Promise<Modulo> {
    await this.acceso.ver(actual, id);
    if (publicado && (await this.modulos.contarActividadesActivas(id)) === 0) {
      throw new ReglaNegocioError(
        'El módulo necesita al menos una actividad activa para publicarse.',
      );
    }
    return this.modulos.cambiarPublicado(id, publicado);
  }

  /**
   * Solo sin asignaciones (la base lo impide con una FK). Borra en cascada
   * contenidos y actividades, y después sus archivos de Storage.
   */
  async eliminar(actual: UsuarioAutenticado, id: bigint): Promise<void> {
    await this.acceso.editar(actual, id);
    if (await this.modulos.tieneAsignaciones(id)) {
      throw new ConflictoError(
        'El módulo tiene asignaciones: despublícalo en lugar de eliminarlo.',
      );
    }
    const rutas = (await this.contenidos.listar(id)).map((c) => c.ruta);
    await this.modulos.eliminar(id);
    try {
      await this.almacen.eliminar('contenidos', rutas);
    } catch {
      // Los registros ya no existen; un archivo huérfano no expone datos.
      this.logger.warn(
        `No se borraron ${rutas.length} archivos del módulo ${id}`,
      );
    }
  }

  private async validarReferencias(
    categoriaId: bigint | null,
    nivelId: bigint | null,
    musicaId: bigint | null,
  ): Promise<void> {
    if (
      categoriaId !== null &&
      !(await this.catalogo.existeCategoria(categoriaId))
    ) {
      throw new ReglaNegocioError('La categoría indicada no existe.');
    }
    if (nivelId !== null && !(await this.catalogo.existeNivel(nivelId))) {
      throw new ReglaNegocioError('El nivel indicado no existe.');
    }
    if (
      musicaId !== null &&
      !(await this.catalogo.existeMusicaActiva(musicaId))
    ) {
      throw new ReglaNegocioError(
        'La música indicada no existe o no está activa.',
      );
    }
  }
}

function limpiarNombre(nombre: string): string {
  const limpio = nombre.trim().replace(/\s+/g, ' ');
  if (!limpio) throw new ReglaNegocioError('El nombre es obligatorio.');
  return limpio;
}
