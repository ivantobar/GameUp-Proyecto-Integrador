/** Tipos de juego del MVP (tabla tipo_juego.codigo). */
export const CODIGOS_JUEGO = [
  'EMPAREJAR',
  'CLASIFICAR',
  'SECUENCIAR',
  'MEMORIA',
  'HABLA_CONMIGO',
  'BUSCA_LA_BOCA',
] as const;

export type CodigoJuego = (typeof CODIGOS_JUEGO)[number];

export function esCodigoJuego(valor: string): valor is CodigoJuego {
  return (CODIGOS_JUEGO as readonly string[]).includes(valor);
}

/** JSON de `actividad.configuracion` ya validado. */
export type Configuracion = Record<string, unknown>;

/**
 * Estrategia de un tipo de juego (principio abierto/cerrado): lo que cambia
 * de un juego a otro vive aquí, no en `switch` repartidos por los servicios.
 * Agregar un juego = agregar una estrategia y registrarla.
 *
 * En la fase 6 se agrega la validación de `intento.resultado`.
 */
export interface EstrategiaJuego {
  readonly codigo: CodigoJuego;
  /**
   * Valida y normaliza `actividad.configuracion`. Lanza ReglaNegocioError
   * (422) con un mensaje claro si no sirve.
   */
  validarConfiguracion(configuracion: Configuracion): Configuracion;
}

export const ESTRATEGIAS_JUEGO = Symbol('ESTRATEGIAS_JUEGO');
