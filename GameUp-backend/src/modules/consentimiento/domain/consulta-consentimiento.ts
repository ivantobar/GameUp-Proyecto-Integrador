/**
 * Puerto ConsultaConsentimiento: el consentimiento vive en la API del núcleo
 * familiar (aceptaTratamiento, codigoVersion; el textoLegal incluye la
 * grabación de voz). GameUP no guarda una copia: lo consulta cada vez.
 *
 * Aún no existe un endpoint para leerlo (pendiente del otro grupo). Cuando
 * exista, se agrega un adaptador HTTP sin tocar los servicios.
 */
export interface ConsentimientoVigente {
  aceptaTratamiento: boolean;
  /** Versión de los términos aceptados (se guarda en cada grabación). */
  codigoVersion: string;
}

export interface ConsultaConsentimiento {
  /**
   * Consentimiento vigente del estudiante, o null si no hay ninguno.
   * Lanza ServicioExternoNoDisponibleError si no se puede consultar.
   */
  vigente(idEstudianteExterno: bigint): Promise<ConsentimientoVigente | null>;
}

export const CONSULTA_CONSENTIMIENTO = Symbol('CONSULTA_CONSENTIMIENTO');

/** Resultado para la app y para las grabaciones (fase 6). */
export type MotivoConsentimiento =
  'ACEPTADO' | 'NO_ACEPTADO' | 'NO_VERIFICABLE';

export interface VerificacionConsentimiento {
  /** true solo si se pudo verificar y está aceptado: si hay dudas, no se graba. */
  concedido: boolean;
  motivo: MotivoConsentimiento;
  codigoVersion: string | null;
  verificadoEn: Date;
}

/** Regla «fallar cerrado»: sin verificación positiva no hay grabación. */
export function interpretarConsentimiento(
  consentimiento: ConsentimientoVigente | null | 'NO_VERIFICABLE',
  verificadoEn: Date,
): VerificacionConsentimiento {
  if (consentimiento === 'NO_VERIFICABLE') {
    return {
      concedido: false,
      motivo: 'NO_VERIFICABLE',
      codigoVersion: null,
      verificadoEn,
    };
  }
  if (!consentimiento?.aceptaTratamiento) {
    return {
      concedido: false,
      motivo: 'NO_ACEPTADO',
      codigoVersion: consentimiento?.codigoVersion ?? null,
      verificadoEn,
    };
  }
  return {
    concedido: true,
    motivo: 'ACEPTADO',
    codigoVersion: consentimiento.codigoVersion,
    verificadoEn,
  };
}
