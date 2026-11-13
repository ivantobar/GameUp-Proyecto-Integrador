import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import { ServicioExternoNoDisponibleError } from '../../../common/errors/dominio.errors.js';
import { RELOJ, type Reloj } from '../../../common/reloj/reloj.js';
import { AccesoEstudianteService } from '../../estudiantes/application/acceso-estudiante.service.js';
import {
  CONSULTA_CONSENTIMIENTO,
  interpretarConsentimiento,
  type ConsentimientoVigente,
  type ConsultaConsentimiento,
  type IdsEstudianteConsentimiento,
  type VerificacionConsentimiento,
} from '../domain/consulta-consentimiento.js';

/** Segundos que se recuerda una respuesta de ASISCO UP (CONSENTIMIENTO_CACHE_SEG). */
export const DURACION_CACHE_CONSENTIMIENTO = Symbol(
  'DURACION_CACHE_CONSENTIMIENTO',
);

/** Tope de entradas en memoria para que la caché no crezca sin límite. */
const MAXIMO_ENTRADAS = 1000;

interface EntradaCache {
  consentimiento: ConsentimientoVigente | null;
  /** Cuándo respondió ASISCO UP (es la hora de verificación que se guarda). */
  verificadoEn: Date;
  /** Milisegundos (epoch) hasta cuando sirve. */
  venceEn: number;
}

/**
 * ¿El acudiente autorizó grabar la voz del estudiante? (Ley 1581 de 2012).
 * Falla cerrado: si la API del núcleo familiar no responde, la respuesta es
 * "no concedido" (NO_VERIFICABLE) y la app no graba.
 *
 * Caché corta (CONSENTIMIENTO_CACHE_SEG, 120 s por defecto, máx. 300): ASISCO
 * UP corre en el plan gratis de Render y tarda en despertar; así una sesión
 * de Habla conmigo no espera en cada vocal. Solo se guardan respuestas
 * definitivas (aceptado o no aceptado); NO_VERIFICABLE nunca, para volver a
 * preguntar en cuanto ASISCO UP responda. Efecto: un retiro de la
 * autorización tarda hasta ese plazo en aplicarse.
 */
@Injectable()
export class ConsentimientoService {
  private readonly logger = new Logger(ConsentimientoService.name);
  private readonly cache = new Map<string, EntradaCache>();
  private readonly ttlMs: number;

  constructor(
    @Inject(CONSULTA_CONSENTIMIENTO)
    private readonly consulta: ConsultaConsentimiento,
    @Inject(RELOJ) private readonly reloj: Reloj,
    private readonly acceso: AccesoEstudianteService,
    @Optional()
    @Inject(DURACION_CACHE_CONSENTIMIENTO)
    duracionCacheSeg: number | null = null,
  ) {
    this.ttlMs = Math.max(0, duracionCacheSeg ?? 0) * 1000;
  }

  /** Para la app: verifica la relación con el estudiante (404 si no le corresponde). */
  async consultarVoz(
    actual: UsuarioAutenticado,
    estudianteId: bigint,
    token?: string | null,
  ): Promise<VerificacionConsentimiento> {
    const estudiante = await this.acceso.obtenerVisible(actual, estudianteId);
    return this.verificar(estudiante, token);
  }

  /**
   * Para las grabaciones (fase 6) y la entrega del audio: el llamador ya
   * verificó la relación. Se pregunta por el `id_usuario` central del
   * estudiante (idUsuarioAuth) y se exige que ASISCO UP responda con su
   * `idEstudianteExterno`.
   */
  async verificar(
    estudiante: IdsEstudianteConsentimiento,
    token?: string | null,
  ): Promise<VerificacionConsentimiento> {
    const ids: IdsEstudianteConsentimiento = {
      idUsuarioAuth: estudiante.idUsuarioAuth,
      idEstudianteExterno: estudiante.idEstudianteExterno,
    };
    const ahora = this.reloj.ahora();
    const clave = `${ids.idUsuarioAuth}:${ids.idEstudianteExterno}`;
    const enCache = this.cache.get(clave);
    if (enCache && enCache.venceEn > ahora.getTime()) {
      return interpretarConsentimiento(
        enCache.consentimiento,
        enCache.verificadoEn,
      );
    }
    this.cache.delete(clave);

    let consentimiento: ConsentimientoVigente | null;
    try {
      consentimiento = await this.consulta.vigente(ids, token);
    } catch (error) {
      if (!(error instanceof ServicioExternoNoDisponibleError)) throw error;
      this.logger.warn('Consentimiento no verificable: no se guardará audio');
      return interpretarConsentimiento('NO_VERIFICABLE', ahora);
    }
    this.guardar(clave, consentimiento, ahora);
    return interpretarConsentimiento(consentimiento, ahora);
  }

  private guardar(
    clave: string,
    consentimiento: ConsentimientoVigente | null,
    ahora: Date,
  ): void {
    if (this.ttlMs === 0) return;
    if (this.cache.size >= MAXIMO_ENTRADAS) {
      for (const [k, e] of this.cache) {
        if (e.venceEn <= ahora.getTime()) this.cache.delete(k);
      }
      // Si sigue llena, sale la más antigua (Map conserva el orden de inserción).
      if (this.cache.size >= MAXIMO_ENTRADAS) {
        const masAntigua = this.cache.keys().next().value;
        if (masAntigua !== undefined) this.cache.delete(masAntigua);
      }
    }
    this.cache.set(clave, {
      consentimiento,
      verificadoEn: ahora,
      venceEn: ahora.getTime() + this.ttlMs,
    });
  }
}
