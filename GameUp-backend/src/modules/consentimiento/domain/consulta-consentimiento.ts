/**
 * Puerto ConsultaConsentimiento: el consentimiento vive en ASISCO UP (API del
 * núcleo familiar). GameUP no guarda una copia: lo consulta cada vez con
 * GET /api/estudiantes/{id}/consentimiento.
 *
 * Desde los términos v1.1-2026, ASISCO UP separa el permiso de voz
 * (autorizaGrabacionVoz). `aceptaTratamiento` significa aquí "se puede grabar
 * la voz": el adaptador HTTP solo lo pone en true si hay consentimiento
 * vigente, al día y con autorizaGrabacionVoz.
 */
export interface ConsentimientoVigente {
  /** true solo si el acudiente autorizó grabar la voz (ver arriba). */
  aceptaTratamiento: boolean;
  /** Versión de los términos aceptados (se guarda en cada grabación). */
  codigoVersion: string;
}

export interface ConsultaConsentimiento {
  /**
   * Consentimiento vigente del estudiante, o null si no hay ninguno.
   * Lanza ServicioExternoNoDisponibleError si no se puede consultar.
   * `token`: JWT de la API de seguridad de quien hace la petición; ASISCO UP
   * lo exige desde el 2026-11-08 (sin él responde 401).
   */
  vigente(
    idEstudianteExterno: bigint,
    token?: string | null,
  ): Promise<ConsentimientoVigente | null>;
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
