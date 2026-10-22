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
  },
  easing: {
    out: Easing.out(Easing.cubic),
    inOut: Easing.inOut(Easing.cubic),
  },
} as const;
