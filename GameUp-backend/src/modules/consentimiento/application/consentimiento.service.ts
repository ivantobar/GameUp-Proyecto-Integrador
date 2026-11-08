import { Inject, Injectable, Logger } from '@nestjs/common';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import { ServicioExternoNoDisponibleError } from '../../../common/errors/dominio.errors.js';
import { RELOJ, type Reloj } from '../../../common/reloj/reloj.js';
import { AccesoEstudianteService } from '../../estudiantes/application/acceso-estudiante.service.js';
import {
  CONSULTA_CONSENTIMIENTO,
  interpretarConsentimiento,
  type ConsultaConsentimiento,
  type VerificacionConsentimiento,
} from '../domain/consulta-consentimiento.js';

/**
 * ¿El acudiente autorizó grabar la voz del estudiante? (Ley 1581 de 2012).
 * Falla cerrado: si la API del núcleo familiar no responde, la respuesta es
 * "no concedido" (NO_VERIFICABLE) y la app no graba.
 */
@Injectable()
export class ConsentimientoService {
  private readonly logger = new Logger(ConsentimientoService.name);

  constructor(
    @Inject(CONSULTA_CONSENTIMIENTO)
    private readonly consulta: ConsultaConsentimiento,
    @Inject(RELOJ) private readonly reloj: Reloj,
    private readonly acceso: AccesoEstudianteService,
  ) {}

  /** Para la app: verifica la relación con el estudiante (404 si no le corresponde). */
  async consultarVoz(
    actual: UsuarioAutenticado,
    estudianteId: bigint,
    token?: string | null,
  ): Promise<VerificacionConsentimiento> {
    const estudiante = await this.acceso.obtenerVisible(actual, estudianteId);
    return this.verificar(estudiante.idEstudianteExterno, token);
  }

  /** Para las grabaciones (fase 6): el llamador ya verificó la relación. */
  async verificar(
    idEstudianteExterno: bigint,
    token?: string | null,
  ): Promise<VerificacionConsentimiento> {
    let consentimiento;
    try {
      consentimiento = await this.consulta.vigente(idEstudianteExterno, token);
    } catch (error) {
      if (!(error instanceof ServicioExternoNoDisponibleError)) throw error;
      this.logger.warn('Consentimiento no verificable: no se guardará audio');
      return interpretarConsentimiento('NO_VERIFICABLE', this.reloj.ahora());
    }
    return interpretarConsentimiento(consentimiento, this.reloj.ahora());
  }
}
