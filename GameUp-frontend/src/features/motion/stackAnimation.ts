import { motion } from '@/theme';

/**
 * Transición entre pantallas del stack.
 *
 * - Normal: «ios_from_right», la pantalla nueva entra desde la derecha y
 *   empuja la anterior. Al volver, el movimiento se invierte.
 * - Reducir movimiento: fundido corto.
 *
 * Limitación del stack nativo (react-native-screens): la duración de los
 * deslizamientos la fija el sistema, así que no se pueden forzar los 300 ms
 * de la guía. `animationDuration` solo aplica al fundido y solo en iOS.
 */
export function stackAnimation(reducedMotion: boolean) {
  if (reducedMotion) {
    return {
      animation: 'fade',
      animationDuration: motion.duration.reducedFade,
    } as const;
  }
  return { animation: 'ios_from_right' } as const;
}
