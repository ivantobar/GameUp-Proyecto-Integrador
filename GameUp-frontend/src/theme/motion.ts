import { Easing } from 'react-native';

/**
 * Movimiento e interacción, según la guía de estilos.
 * Si la persona activó «reducir movimiento», las transiciones se reemplazan
 * por un fundido corto (ver `src/features/motion`).
 */
export const motion = {
  duration: {
    /** Avanzar: la pantalla nueva entra desde la derecha. */
    forward: 300,
    /** Volver: el mismo movimiento en sentido contrario. */
    back: 300,
    /** Cambio entre slides de onboarding. */
    onboarding: 400,
    /** Fundido al enviar y al volver al inicio. */
    confirm: 250,
    /** Cambio de color de botones, opciones, chips y tarjetas. */
    state: 150,
    /** Fundido corto cuando está activo «reducir movimiento». */
    reducedFade: 150,
    /** [GameUP] Hundirse al presionar y volver a subir. */
    press: 120,
    /** [GameUP] Entrada de una opción o tarjeta (con desplazamiento corto). */
    enter: 300,
    /** [GameUP] Retraso entre una opción y la siguiente (entrada escalonada). */
    stagger: 60,
    /** [GameUP] Cada estrella o pieza de confeti de una celebración. */
    celebrate: 400,
    /**
     * [GameUP] Medio ciclo de la «respiración» de la opción correcta y de la
     * manito de pista: lento a propósito. Se repite pocas veces y para.
     */
    breathe: 900,
  },
  /**
   * [GameUP] Cuántas veces se repite una animación de apoyo antes de parar.
   * Nada se mueve en bucle infinito durante el juego.
   */
  repeat: {
    breathe: 2,
    hint: 3,
  },
  /** [GameUP] Escala máxima de la «respiración» (sutil: 4 %). */
  breatheScale: 1.04,
  /** [GameUP] Escala al presionar una tarjeta de juego (rebote leve). */
  pressScale: 0.97,
  /** [GameUP] Desplazamiento vertical con el que entra una opción. */
  enterOffset: 16,
  easing: {
    out: Easing.out(Easing.cubic),
    inOut: Easing.inOut(Easing.cubic),
  },
  /**
   * [GameUP] Las mismas curvas como puntos de control de Bézier, para las
   * animaciones de Reanimated (que corren en el hilo de la interfaz y no
   * pueden usar las funciones de `Easing` de React Native).
   */
  bezier: {
    out: [0.33, 1, 0.68, 1],
    inOut: [0.65, 0, 0.35, 1],
  },
  /**
   * [GameUP] Resortes de Reanimated 4 por duración: `dampingRatio` 1 no
   * rebota; menos de 1 rebota un poco. Nunca un rebote exagerado.
   */
  spring: {
    /** Volver de presionado: firme, sin rebote. */
    press: { duration: 200, dampingRatio: 1 },
    /** Aparecer o celebrar: rebote leve. */
    gentle: { duration: 400, dampingRatio: 0.7 },
  },
} as const;

export type SpringPreset = keyof typeof motion.spring;
