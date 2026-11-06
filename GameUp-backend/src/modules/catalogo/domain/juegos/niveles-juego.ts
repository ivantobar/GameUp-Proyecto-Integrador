import { ReglaNegocioError } from '../../../../common/errors/dominio.errors.js';
import type { CodigoJuego } from './estrategia-juego.js';

/**
 * Escalera de niveles por juego (fase 9). Cada juego con escalera tiene 5
 * niveles, cada uno un poco más difícil. NO son los niveles BAJO/MEDIO/ALTO
 * de la tabla `nivel`. Lo que exige cada nivel vive en la estrategia de su
 * juego (`validarNivel`); aquí, lo común.
 */

export const NIVEL_JUEGO_MINIMO = 1;
export const NIVEL_JUEGO_MAXIMO = 5;

export const JUEGOS_CON_ESCALERA = [
  'EMPAREJAR',
  'CLASIFICAR',
  'SECUENCIAR',
  'MEMORIA',
] as const satisfies readonly CodigoJuego[];

export type JuegoConEscalera = (typeof JUEGOS_CON_ESCALERA)[number];

export function esJuegoConEscalera(codigo: string): codigo is JuegoConEscalera {
  return (JUEGOS_CON_ESCALERA as readonly string[]).includes(codigo);
}

export function esNivelJuego(nivel: unknown): nivel is number {
  return (
    typeof nivel === 'number' &&
    Number.isInteger(nivel) &&
    nivel >= NIVEL_JUEGO_MINIMO &&
    nivel <= NIVEL_JUEGO_MAXIMO
  );
}

/** El nivel pedido existe (1 a 5); si no, 422. */
export function exigirNivelJuego(nivel: number): void {
  if (!esNivelJuego(nivel)) {
    throw new ReglaNegocioError(
      `El nivel debe ser un número entre ${NIVEL_JUEGO_MINIMO} y ${NIVEL_JUEGO_MAXIMO}.`,
    );
  }
}

/** Qué pide cada nivel de un juego, del 1 al 5. */
export type TablaNiveles<T> = Readonly<Record<1 | 2 | 3 | 4 | 5, T>>;

export function reglaDelNivel<T>(tabla: TablaNiveles<T>, nivel: number): T {
  exigirNivelJuego(nivel);
  return tabla[nivel as 1 | 2 | 3 | 4 | 5];
}

/**
 * Falla con un mensaje que la directora entienda, por ejemplo:
 * «Memoria nivel 3: configuracion.tableros[0] necesita 4 parejas (tiene 3).»
 */
export function exigirCantidadDelNivel(
  juego: string,
  nivel: number,
  ruta: string,
  que: string,
  esperado: number,
  real: number,
): void {
  if (real !== esperado) {
    throw new ReglaNegocioError(
      `${juego} nivel ${nivel}: ${ruta} necesita ${esperado} ${que} (tiene ${real}).`,
    );
  }
}
