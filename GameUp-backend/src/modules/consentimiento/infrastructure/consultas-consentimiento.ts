import { ServicioExternoNoDisponibleError } from '../../../common/errors/dominio.errors.js';
import type {
  ConsentimientoVigente,
  ConsultaConsentimiento,
} from '../domain/consulta-consentimiento.js';

/**
 * Adaptador mientras no exista el endpoint de lectura en la API del núcleo
 * familiar: siempre "no se puede verificar". Con la regla de fallar cerrado,
 * ninguna grabación se guarda.
 */
export class ConsultaConsentimientoNoDisponible implements ConsultaConsentimiento {
  vigente(): Promise<ConsentimientoVigente | null> {
    return Promise.reject(
      new ServicioExternoNoDisponibleError(
        'No se puede consultar el consentimiento: la API del núcleo familiar aún no está conectada.',
      ),
    );
  }
}

/**
 * SOLO DESARROLLO (CONSENTIMIENTO_SIMULADO=true; prohibido en producción):
 * responde que todos los estudiantes tienen el consentimiento aceptado, para
 * probar el flujo de Habla conmigo con la app.
 */
export class ConsultaConsentimientoSimulada implements ConsultaConsentimiento {
  static readonly CODIGO_VERSION = 'SIMULADO-DEV';

  vigente(): Promise<ConsentimientoVigente | null> {
    return Promise.resolve({
      aceptaTratamiento: true,
      codigoVersion: ConsultaConsentimientoSimulada.CODIGO_VERSION,
    });
  }
}
