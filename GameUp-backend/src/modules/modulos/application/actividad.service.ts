import { Inject, Injectable } from '@nestjs/common';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import {
  ConflictoError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../../../common/errors/dominio.errors.js';
import { RegistroJuegosService } from '../../catalogo/application/registro-juegos.service.js';
import {
  CATALOGO_REPOSITORY,
  type CatalogoRepository,
} from '../../catalogo/domain/catalogo.js';
import {
  esCodigoJuego,
  type Configuracion,
  type ConfiguracionValidada,
} from '../../catalogo/domain/juegos/estrategia-juego.js';
import {
  MAXIMO_ELEMENTOS,
  TIPOS_REFERENCIA,
  type Actividad,
  type Contenido,
  type ElementoActividad,
  type TipoContenido,
} from '../domain/modulo.entity.js';
import {
  ACTIVIDAD_REPOSITORY,
  CONTENIDO_REPOSITORY,
  type ActividadRepository,
  type CambiosActividad,
  type ContenidoRepository,
} from '../domain/modulo.repository.js';
import { AccesoModuloService } from './acceso-modulo.service.js';

const NO_EXISTE = 'La actividad no existe.';

export interface NuevaActividad {
  tipoJuego: string;
  titulo: string;
  instruccionTexto: string | null;
  configuracion: Configuracion;
  orden: number;
  activa: boolean;
}

export interface ActividadConElementos {
  actividad: Actividad;
  elementos: ElementoActividad[];
}

/**
 * Actividades de un módulo. La configuración se valida con la estrategia del
 * tipo de juego (RegistroJuegosService), no con condicionales por juego.
 */
@Injectable()
export class ActividadService {
  constructor(
    @Inject(ACTIVIDAD_REPOSITORY)
    private readonly actividades: ActividadRepository,
    @Inject(CONTENIDO_REPOSITORY)
    private readonly contenidos: ContenidoRepository,
    @Inject(CATALOGO_REPOSITORY) private readonly catalogo: CatalogoRepository,
    private readonly juegos: RegistroJuegosService,
    private readonly acceso: AccesoModuloService,
  ) {}

  /** Estudiante y acudiente ven solo las activas. */
  async listar(
    actual: UsuarioAutenticado,
    moduloId: bigint,
  ): Promise<Actividad[]> {
    await this.acceso.ver(actual, moduloId);
    return this.actividades.listar(moduloId, this.acceso.esFamilia(actual));
  }

  async obtener(
    actual: UsuarioAutenticado,
    id: bigint,
  ): Promise<ActividadConElementos> {
    const actividad = await this.existente(id);
    await this.verModulo(actual, actividad.moduloId);
    if (!actividad.activa && this.acceso.esFamilia(actual)) {
      throw new RecursoNoEncontradoError(NO_EXISTE);
    }
    return { actividad, elementos: await this.actividades.elementos(id) };
  }

  async crear(
    actual: UsuarioAutenticado,
    moduloId: bigint,
    datos: NuevaActividad,
  ): Promise<Actividad> {
    await this.acceso.editar(actual, moduloId);
    if (!esCodigoJuego(datos.tipoJuego)) {
      throw new ReglaNegocioError(
        `El tipo de juego ${datos.tipoJuego} no existe.`,
      );
    }
    const tipo = await this.catalogo.tipoJuegoPorCodigo(datos.tipoJuego);
    if (!tipo) {
      throw new ReglaNegocioError(
        `El tipo de juego ${datos.tipoJuego} no existe.`,
      );
    }
    const validada = this.juegos
      .estrategia(tipo.codigo)
      .validarConfiguracion(datos.configuracion);
    const elementos = await this.elementosDerivados(moduloId, validada);

    // Actividad y actividad_contenido se escriben en una sola transacción.
    return this.actividades.crear(
      moduloId,
      {
        tipoJuegoId: tipo.id,
        titulo: limpiarTitulo(datos.titulo),
        instruccionTexto: datos.instruccionTexto?.trim() || null,
        configuracion: validada.configuracion,
        orden: datos.orden,
        activa: datos.activa,
      },
      elementos,
    );
  }

  /** El tipo de juego no cambia (los intentos dependen de él): se crea otra actividad. */
  async actualizar(
    actual: UsuarioAutenticado,
    id: bigint,
    cambios: CambiosActividad,
  ): Promise<Actividad> {
    const actividad = await this.existente(id);
    await this.editarModulo(actual, actividad.moduloId);
    const validada =
      cambios.configuracion === null
        ? null
        : this.juegos
            .estrategia(actividad.tipoJuego.codigo)
            .validarConfiguracion(cambios.configuracion);
    const elementos = validada
      ? await this.elementosDerivados(actividad.moduloId, validada)
      : null;
    return this.actividades.actualizar(
      id,
      {
        ...cambios,
        titulo: cambios.titulo === null ? null : limpiarTitulo(cambios.titulo),
        configuracion: validada?.configuracion ?? null,
      },
      elementos,
    );
  }

  /** Solo sin intentos (los intentos son historial del estudiante). */
  async eliminar(actual: UsuarioAutenticado, id: bigint): Promise<void> {
    const actividad = await this.existente(id);
    await this.editarModulo(actual, actividad.moduloId);
    if (await this.actividades.tieneIntentos(id)) {
      throw new ConflictoError(
        'La actividad ya tiene intentos: desactívala (activa = false) en lugar de eliminarla.',
      );
    }
    await this.actividades.eliminar(id);
  }

  /**
   * Reemplaza los contenidos de la actividad. Todos deben ser del mismo
   * módulo (la base lo exige con un trigger; aquí se valida antes) y del
   * tipo correcto: imagen → IMAGEN, kinema → IMAGEN/ANIMACION/VIDEO,
   * audio → AUDIO. Si no se indica imagen, se usa el contenido si es IMAGEN.
   *
   * En EMPAREJAR, CLASIFICAR, SECUENCIAR y MEMORIA los contenidos salen de
   * la configuración (sus caras): ahí no se editan a mano.
   */
  async reemplazarElementos(
    actual: UsuarioAutenticado,
    id: bigint,
    elementos: ElementoActividad[],
  ): Promise<ElementoActividad[]> {
    const actividad = await this.existente(id);
    await this.editarModulo(actual, actividad.moduloId);
    if (this.juegos.estrategia(actividad.tipoJuego.codigo).derivaContenidos) {
      throw new ReglaNegocioError(
        `En ${actividad.tipoJuego.codigo} los contenidos salen de la configuración: modifica la configuración.`,
      );
    }
    const normalizados = await this.validarElementos(
      actividad.moduloId,
      elementos,
      (_e, i) => `Elemento ${i + 1}`,
    );
    return this.actividades.reemplazarElementos(id, normalizados);
  }

  /**
   * Los contenidos que citan las caras de la configuración, como elementos
   * de actividad_contenido (validados contra el módulo). null si el juego no
   * los deriva de su configuración.
   */
  private async elementosDerivados(
    moduloId: bigint,
    validada: ConfiguracionValidada,
  ): Promise<ElementoActividad[] | null> {
    if (validada.elementos === null) return null;
    const elementos: ElementoActividad[] = validada.elementos.map((e, i) => ({
      contenidoId: e.imagenContenidoId,
      rolEnJuego: null,
      orden: i,
      palabra: e.palabra,
      imagenContenidoId: e.imagenContenidoId,
      kinemaContenidoId: null,
      audioContenidoId: e.audioContenidoId,
    }));
    return this.validarElementos(
      moduloId,
      elementos,
      (e) => `La configuración cita el contenido ${e.contenidoId}`,
    );
  }

  /** Todos los contenidos son del módulo y del tipo correcto (422 si no). */
  private async validarElementos(
    moduloId: bigint,
    elementos: ElementoActividad[],
    describir: (e: ElementoActividad, i: number) => string,
  ): Promise<ElementoActividad[]> {
    if (elementos.length > MAXIMO_ELEMENTOS) {
      throw new ReglaNegocioError(
        `Una actividad admite hasta ${MAXIMO_ELEMENTOS} contenidos.`,
      );
    }

    const delModulo = new Map(
      (await this.contenidos.listar(moduloId)).map((c) => [c.id, c]),
    );
    const vistos = new Set<bigint>();
    return elementos.map((e, i) => {
      const posicion = describir(e, i);
      if (vistos.has(e.contenidoId)) {
        throw new ReglaNegocioError(`${posicion}: el contenido está repetido.`);
      }
      vistos.add(e.contenidoId);
      const principal = exigirDelModulo(delModulo, e.contenidoId, posicion);
      const imagenId =
        e.imagenContenidoId ??
        (principal.tipo === 'IMAGEN' ? principal.id : null);
      if (imagenId === null) {
        throw new ReglaNegocioError(
          `${posicion}: indica imagenContenidoId (el contenido principal no es una imagen).`,
        );
      }
      exigirTipo(
        delModulo,
        imagenId,
        TIPOS_REFERENCIA.imagen,
        `${posicion} (imagen)`,
      );
      if (e.kinemaContenidoId !== null) {
        exigirTipo(
          delModulo,
          e.kinemaContenidoId,
          TIPOS_REFERENCIA.kinema,
          `${posicion} (kinema)`,
        );
      }
      if (e.audioContenidoId !== null) {
        exigirTipo(
          delModulo,
          e.audioContenidoId,
          TIPOS_REFERENCIA.audio,
          `${posicion} (audio)`,
        );
      }
      return {
        ...e,
        rolEnJuego: e.rolEnJuego?.trim() || null,
        palabra: e.palabra?.trim() || null,
        imagenContenidoId: imagenId,
      };
    });
  }

  private async existente(id: bigint): Promise<Actividad> {
    const actividad = await this.actividades.buscarPorId(id);
    if (!actividad) throw new RecursoNoEncontradoError(NO_EXISTE);
    return actividad;
  }

  /** Si no ve el módulo, la actividad "no existe". */
  private async verModulo(
    actual: UsuarioAutenticado,
    moduloId: bigint,
  ): Promise<void> {
    await this.acceso.ver(actual, moduloId).catch(comoActividadInexistente);
  }

  private async editarModulo(
    actual: UsuarioAutenticado,
    moduloId: bigint,
  ): Promise<void> {
    await this.acceso.editar(actual, moduloId).catch(comoActividadInexistente);
  }
}

/** El 404 del módulo se informa como "la actividad no existe"; el resto pasa igual. */
function comoActividadInexistente(error: unknown): never {
  throw error instanceof RecursoNoEncontradoError
    ? new RecursoNoEncontradoError(NO_EXISTE)
    : error;
}

function limpiarTitulo(titulo: string): string {
  const limpio = titulo.trim().replace(/\s+/g, ' ');
  if (!limpio) throw new ReglaNegocioError('El título es obligatorio.');
  return limpio;
}

function exigirDelModulo(
  contenidos: Map<bigint, Contenido>,
  id: bigint,
  posicion: string,
): Contenido {
  const contenido = contenidos.get(id);
  if (!contenido) {
    throw new ReglaNegocioError(
      `${posicion}: el contenido ${id} no es de este módulo.`,
    );
  }
  return contenido;
}

function exigirTipo(
  contenidos: Map<bigint, Contenido>,
  id: bigint,
  tipos: readonly TipoContenido[],
  posicion: string,
): void {
  const contenido = exigirDelModulo(contenidos, id, posicion);
  if (!tipos.includes(contenido.tipo)) {
    throw new ReglaNegocioError(`${posicion}: debe ser ${tipos.join(' o ')}.`);
  }
}
