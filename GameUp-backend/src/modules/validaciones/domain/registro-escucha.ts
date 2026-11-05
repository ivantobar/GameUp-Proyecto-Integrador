/**
 * Quién pidió escuchar el audio de qué intento. Para validar un intento de
 * voz con audio disponible, el validador debe haber pedido antes la URL
 * firmada (decisión 6 de la fase 7): nadie aprueba ni rechaza a ciegas.
 */
export interface RegistroEscucha {
  /** El validador obtuvo la URL firmada del audio del intento. */
  marcar(validadorId: bigint, intentoId: bigint): Promise<void>;
  /** ¿Este validador pidió el audio de este intento (y sigue vigente)? */
  escucho(validadorId: bigint, intentoId: bigint): Promise<boolean>;
  /** Tras validar: ya no hace falta recordarlo. */
  olvidar(intentoId: bigint): Promise<void>;
}

export const REGISTRO_ESCUCHA = Symbol('REGISTRO_ESCUCHA');

/** Cuánto vale haber pedido el audio: una jornada de revisión. */
export const VIGENCIA_ESCUCHA_HORAS = 12;
