import { useState } from 'react';
import { Animated } from 'react-native';
import { motion } from '@/theme';

/**
 * Animación de 150 ms entre el estado normal (0) y el presionado (1), como
 * pide la guía para botones, opciones, chips y tarjetas.
 *
 * Es un cambio de color, no un movimiento, así que no depende de
 * «reducir movimiento».
 */
export function usePressFeedback() {
  // useState con inicializador: el valor animado se crea una sola vez.
  const [progress] = useState(() => new Animated.Value(0));

  const animateTo = (toValue: 0 | 1) => {
    Animated.timing(progress, {
      toValue,
      duration: motion.duration.state,
      easing: motion.easing.out,
      // Los colores no se pueden animar con el driver nativo.
      useNativeDriver: false,
    }).start();
  };

  return {
    progress,
    onPressIn: () => animateTo(1),
    onPressOut: () => animateTo(0),
  };
}

/** Interpola un color entre el estado normal y el presionado. */
export function pressColor(
  progress: Animated.Value,
  normal: string,
  pressed: string,
) {
  return progress.interpolate({
    inputRange: [0, 1],
    outputRange: [normal, pressed],
  });
}
