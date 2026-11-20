import { Easing } from 'react-native-reanimated';
import { motion } from '@/theme';

/**
 * Curvas de `motion.bezier` listas para Reanimated. Se crean una sola vez
 * aquí para que todas las animaciones de la app usen las mismas.
 */
export const curves = {
  out: Easing.bezier(...motion.bezier.out),
  inOut: Easing.bezier(...motion.bezier.inOut),
} as const;
