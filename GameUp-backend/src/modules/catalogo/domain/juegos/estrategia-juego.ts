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

/** JSON de `actividad.configuracion` o de `intento.resultado`. */
export type Configuracion = Record<string, unknown>;

/**
 * Un contenido que usa la configuración (una «cara» con imagen). Se copia a
 * actividad_contenido para saber qué contenidos usa la actividad: así no se
 * pueden borrar mientras estén en uso y salen en las URLs del módulo.
 */
export interface ElementoDerivado {
  imagenContenidoId: bigint;
  audioContenidoId: bigint | null;
  /** La etiqueta de la cara (lo que oye el niño). */
  palabra: string;
}

export interface ConfiguracionValidada {
  /** Normalizada (textos sin espacios de sobra, ids como texto). */
  configuracion: Configuracion;
  /**
   * Contenidos que cita la configuración, o null si el juego no deriva sus
   * contenidos de la configuración (se editan a mano).
   */
  elementos: ElementoDerivado[] | null;
}

/**
 * Lo que debe medir el resultado de un intento según la configuración:
 * `total` (turnos) en los juegos por turnos, `pairs` en Memoria.
 */
export interface MedidaResultado {
  campo: 'total' | 'pairs';
  valor: number;
}

/**
 * Estrategia de un tipo de juego (principio abierto/cerrado): lo que cambia
 * de un juego a otro vive aquí, no en `switch` repartidos por los servicios.
 * Agregar un juego = agregar una estrategia y registrarla.
 *
 * Todas rechazan tiempo límite, vidas y penalizaciones (regla 11).
 */
export interface EstrategiaJuego {
  readonly codigo: CodigoJuego;
  /** true: actividad_contenido sale de la configuración (no se edita a mano). */
  readonly derivaContenidos: boolean;
  /** Valida y normaliza `actividad.configuracion` (422 si no sirve). */
  validarConfiguracion(configuracion: Configuracion): ConfiguracionValidada;
  /** Medida esperada del resultado, o null si el juego no la tiene. */
  medida(configuracion: Configuracion): MedidaResultado | null;
  /**
   * Valida `intento.resultado` contra la configuración de la actividad
   * (422 si no sirve). Nunca calcula una nota ni aprueba nada.
   */
  validarResultado(
    resultado: Configuracion,
    configuracion: Configuracion,
  ): Configuracion;
}

export const ESTRATEGIAS_JUEGO = Symbol('ESTRATEGIAS_JUEGO');
