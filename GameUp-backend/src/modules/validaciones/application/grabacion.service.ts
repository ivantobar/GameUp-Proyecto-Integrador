import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ALMACEN_ARCHIVOS,
  type AlmacenArchivos,
  type UrlFirmada,
} from '../../../common/almacenamiento/almacen-archivos.js';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import {
  AccesoDenegadoError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
  ServicioExternoNoDisponibleError,
} from '../../../common/errors/dominio.errors.js';
import { RELOJ, type Reloj } from '../../../common/reloj/reloj.js';
import { ConsentimientoService } from '../../consentimiento/application/consentimiento.service.js';
import { AccesoEstudianteService } from '../../estudiantes/application/acceso-estudiante.service.js';
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

/** El acudiente ya no autoriza grabar la voz: el audio no se entrega (403). */
export const AUTORIZACION_RETIRADA =
  'El acudiente retiró la autorización de grabar la voz.';

/** ASISCO UP no responde: sin verificar, el audio no se entrega (503). */
export const AUTORIZACION_NO_VERIFICABLE =
  'No se puede verificar la autorización de grabar la voz en este momento. Intenta de nuevo en unos minutos.';

const NO_SE_PUDO_BORRAR =
  'No se pudieron borrar las grabaciones. Intenta de nuevo en unos minutos.';

const NO_DISPONIBLE =
  'El audio no está disponible (no se grabó, venció o ya se validó el intento).';

export interface ResultadoLimpieza {
  borradas: number;
  fallidas: number;
}

/**
 * Voz del estudiante en el bucket privado `grabaciones`:
 *  - se entrega solo con URL firmada de ≤ 10 min a la tallerista a cargo o
 *    a la directora (el controlador exige el rol; aquí, la relación), y solo
 *    si el consentimiento SIGUE vigente en ASISCO UP: retirado → 403, sin
 *    poder verificar → 503 (falla cerrado). Nunca se borra por eso;
 *  - se borra al validarse el intento (APROBADO o RECHAZADO), a los 30 días
 *    si nunca se valida (si Storage falla, se reintenta: vista
 *    grabacion_por_eliminar) y cuando la directora borra todas las de un
 *    estudiante (DELETE /estudiantes/:id/grabaciones).
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
    private readonly consentimiento: ConsentimientoService,
    private readonly acceso: AccesoEstudianteService,
  ) {}

  async urlAudio(
    actual: UsuarioAutenticado,
    intentoId: bigint,
    token: string | null = null,
  ): Promise<UrlFirmada> {
    // 404 si el intento no existe o el estudiante no le corresponde.
    const intento = await this.intentos.obtener(actual, intentoId);
    const grabacion = await this.grabaciones.buscarPorIntento(intentoId);
    if (!grabacion || grabacion.eliminadaEn)
      throw new RecursoNoEncontradoError(NO_DISPONIBLE);
    await this.exigirConsentimientoVigente(intento.estudianteId, token);
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
   * Borrado a pedido (derecho de supresión, Ley 1581): todas las grabaciones
   * de un estudiante que siguen en Storage. Lo exige la directora (el
   * controlador). Si Storage falla, no se marca nada y responde 503 para
   * reintentar. La fila de grabacion_estudiante queda con eliminada_en: el
   * archivo se borra y se conserva qué versión de términos se había aceptado.
   */
  async borrarDeEstudiante(
    actual: UsuarioAutenticado,
    estudianteId: bigint,
  ): Promise<{ borradas: number }> {
    await this.acceso.existente(estudianteId);
    const pendientes = await this.grabaciones.activasDeEstudiante(estudianteId);
    for (let i = 0; i < pendientes.length; i += LOTE_LIMPIEZA) {
      const lote = pendientes.slice(i, i + LOTE_LIMPIEZA);
      try {
        await this.almacen.eliminar(
          'grabaciones',
          lote.map((g) => g.ruta),
        );
      } catch {
        this.logger.warn(
          `No se pudieron borrar las grabaciones del estudiante ${estudianteId} (pedido del usuario ${actual.id})`,
        );
        throw new ServicioExternoNoDisponibleError(NO_SE_PUDO_BORRAR);
      }
      await this.grabaciones.marcarEliminadas(
        lote.map((g) => g.id),
        this.reloj.ahora(),
      );
      for (const g of lote) await this.escuchas.olvidar(g.intentoId);
    }
    this.logger.log(
      `Grabaciones borradas a pedido: ${pendientes.length} del estudiante ${estudianteId} (usuario ${actual.id})`,
    );
    return { borradas: pendientes.length };
  }

  /** Retirado → 403; ASISCO UP sin responder → 503. Nunca borra nada. */
  private async exigirConsentimientoVigente(
    estudianteId: bigint,
    token: string | null,
  ): Promise<void> {
    const estudiante = await this.acceso.existente(estudianteId);
    const verificacion = await this.consentimiento.verificar(estudiante, token);
    if (verificacion.concedido) return;
    if (verificacion.motivo === 'NO_VERIFICABLE') {
      throw new ServicioExternoNoDisponibleError(AUTORIZACION_NO_VERIFICABLE);
    }
    throw new AccesoDenegadoError(AUTORIZACION_RETIRADA);
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
