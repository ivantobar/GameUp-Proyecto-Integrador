import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { curves } from '@/components/ui';
import { useReducedMotion } from '@/features/motion/useReducedMotion';
import { motion } from '@/theme';

interface BreatheProps {
  /**
   * Solo DESPUÉS de la pista o del acierto: nunca antes, para no regalar la
   * respuesta.
   */
  active: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * La tarjeta «respira»: crece un 4 % y vuelve, despacio (900 ms cada
 * medio ciclo), dos veces, y se detiene. Nada en bucle infinito durante el
 * juego. Con «reducir movimiento» no se mueve (la pista ya se ve por el
 * borde punteado y la píldora «Prueba esta»).
 */
export function Breathe({ active, children, style, testID }: BreatheProps) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!active || reduced) {
      cancelAnimation(scale);
      scale.value = 1;
      return;
    }
    const half = { duration: motion.duration.breathe, easing: curves.inOut };
    scale.value = withRepeat(
      withSequence(withTiming(motion.breatheScale, half), withTiming(1, half)),
      motion.repeat.breathe,
    );
  }, [active, reduced, scale]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[style, animated]} testID={testID}>
      {children}
    </Animated.View>
  );
}
