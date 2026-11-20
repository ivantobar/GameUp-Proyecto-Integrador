import {
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { motion } from '@/theme';
import { curves } from './motionCurves';

export interface PressFeedback {
  /** 0 = normal, 1 = presionado. Se lee en `useAnimatedStyle`. */
  progress: SharedValue<number>;
  onPressIn: () => void;
  onPressOut: () => void;
}

/**
 * Estado presionado de botones, opciones, chips y tarjetas: un valor de 0 a
 * 1 que se anima en el hilo de la interfaz (Reanimated), así el toque se
 * siente inmediato también en celulares de gama baja.
 *
 * Con «reducir movimiento» activo, Reanimated salta directo al valor final
 * (`ReduceMotion.System`, el valor por defecto): el cambio de color y el
 * hundimiento se ven, pero sin transición.
 */
export function usePressFeedback(): PressFeedback {
  const progress = useSharedValue(0);

  const animateTo = (toValue: 0 | 1) => {
    progress.value = withTiming(toValue, {
      duration: motion.duration.press,
      easing: curves.out,
    });
  };

  return {
    progress,
    onPressIn: () => animateTo(1),
    onPressOut: () => animateTo(0),
  };
}
