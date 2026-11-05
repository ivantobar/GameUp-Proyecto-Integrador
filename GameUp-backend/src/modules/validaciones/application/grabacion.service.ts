import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ALMACEN_ARCHIVOS,
  type AlmacenArchivos,
  type UrlFirmada,
} from '../../../common/almacenamiento/almacen-archivos.js';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import {
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../../../common/errors/dominio.errors.js';
import { RELOJ, type Reloj } from '../../../common/reloj/reloj.js';
import { IntentoService } from '../../intentos/application/intento.service.js';
import {
  REGISTRO_ESCUCHA,
  type RegistroEscucha,
} from '../domain/registro-escucha.js';
import {
  PLAZO_GRABACION_DIAS,
  type GrabacionGuardada,
} from '../domain/validacion.js';
import {
  GRABACION_REPOSITORY,
  type GrabacionRepository,
} from '../domain/validacion.repository.js';

/** URLs firmadas de audio: máximo 10 minutos (regla de datos de menores). */
export const DURACION_URL_AUDIO_SEG = 10 * 60;
/** Cuántas grabaciones se borran por pasada de limpieza. */
export const LOTE_LIMPIEZA = 100;

export const ESCUCHA_OBLIGATORIA =
  'Antes de validar, escucha la grabación de este intento.';

const NO_DISPONIBLE =
  'El audio no está disponible (no se grabó, venció o ya se validó el intento).';

export interface ResultadoLimpieza {
  borradas: number;
  fallidas: number;
}

/**
 * Voz del estudiante en el bucket privado `grabaciones`:
 *  - se entrega solo con URL firmada de ≤ 10 min a la tallerista a cargo o
 *    a la directora (el controlador exige el rol; aquí, la relación);
 *  - se borra al validarse el intento (APROBADO o RECHAZADO) y a los 30 días
 *    si nunca se valida; si Storage falla, se reintenta (vista
 *    grabacion_por_eliminar).
 * Nunca se registran rutas en los logs.
 */
@Injectable()
export class GrabacionService {
  private readonly logger = new Logger(GrabacionService.name);

  constructor(
    @Inject(GRABACION_REPOSITORY)
    private readonly grabaciones: GrabacionRepository,
    @Inject(ALMACEN_ARCHIVOS) private readonly almacen: AlmacenArchivos,
    @Inject(RELOJ) private readonly reloj: Reloj,
    private readonly intentos: IntentoService,
    @Inject(REGISTRO_ESCUCHA) private readonly escuchas: RegistroEscucha,
  ) {}

  async urlAudio(
    actual: UsuarioAutenticado,
    intentoId: bigint,
  ): Promise<UrlFirmada> {
    // 404 si el intento no existe o el estudiante no le corresponde.
    await this.intentos.obtener(actual, intentoId);
    const grabacion = await this.grabaciones.buscarPorIntento(intentoId);
    if (!grabacion || grabacion.eliminadaEn)
      throw new RecursoNoEncontradoError(NO_DISPONIBLE);
    const urls = await this.almacen.urlsFirmadas(
      'grabaciones',
      [grabacion.ruta],
      DURACION_URL_AUDIO_SEG,
    );
    const url = urls.get(grabacion.ruta);
    if (!url) throw new RecursoNoEncontradoError(NO_DISPONIBLE);
    await this.escuchas.marcar(actual.id, intentoId);
    return url;
  }

  /**
   * Si el intento tiene audio disponible, quien valida debe haberlo pedido
   * antes (URL firmada); si no, 422. Sin audio (no se grabó, venció), pasa.
   */
  async exigirEscucha(
    actual: UsuarioAutenticado,
    intentoId: bigint,
  ): Promise<void> {
    const grabacion = await this.grabaciones.buscarPorIntento(intentoId);
    if (!grabacion || grabacion.eliminadaEn) return;
    if (!(await this.escuchas.escucho(actual.id, intentoId)))
      throw new ReglaNegocioError(ESCUCHA_OBLIGATORIA);
  }

  /** Tras validar un intento. Si falla, la limpieza programada lo reintenta. */
  async borrarDeIntento(intentoId: bigint): Promise<void> {
    await this.escuchas.olvidar(intentoId);
    const grabacion = await this.grabaciones.buscarPorIntento(intentoId);
    if (grabacion && !grabacion.eliminadaEn) await this.borrar([grabacion]);
  }

  /** Una pasada: validadas sin borrar + vencidas por el plazo de 30 días. */
  async limpiar(): Promise<ResultadoLimpieza> {
    const limite = new Date(
      this.reloj.ahora().getTime() - PLAZO_GRABACION_DIAS * 24 * 60 * 60 * 1000,
    );
    const pendientes = [
      ...(await this.grabaciones.validadasSinBorrar(LOTE_LIMPIEZA)),
      ...(await this.grabaciones.vencidas(limite, LOTE_LIMPIEZA)),
    ];
    if (pendientes.length === 0) return { borradas: 0, fallidas: 0 };
    const borradas = await this.borrar(pendientes);
    const resultado = { borradas, fallidas: pendientes.length - borradas };
    this.logger.log(
      `Limpieza de grabaciones: ${resultado.borradas} borradas, ${resultado.fallidas} para reintentar`,
    );
    return resultado;
  }

  /** Borra los archivos y marca eliminada_en. Devuelve cuántas quedaron borradas. */
  private async borrar(grabaciones: GrabacionGuardada[]): Promise<number> {
    try {
      await this.almacen.eliminar(
        'grabaciones',
        grabaciones.map((g) => g.ruta),
      );
      await this.grabaciones.marcarEliminadas(
        grabaciones.map((g) => g.id),
        this.reloj.ahora(),
      );
      return grabaciones.length;
    } catch {
      // Quedan sin eliminada_en: la próxima pasada lo reintenta.
      this.logger.warn(
        `No se pudieron borrar ${grabaciones.length} grabaciones; se reintentará`,
      );
      return 0;
    }
  }
}
