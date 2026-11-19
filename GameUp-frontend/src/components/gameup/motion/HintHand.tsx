import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { curves } from '@/components/ui';
import { useReducedMotion } from '@/features/motion/useReducedMotion';
import { motion, sizes } from '@/theme';
import { Illustration } from '../illustrations';

/** Cuánto baja la manito al «tocar» (dp). */
const TAP = 4;

/**
 * Manito de pista: «toca» despacio (baja y sube 4 dp, 900 ms cada medio
 * ciclo), tres veces, y se queda quieta. Con «reducir movimiento», quieta.
 * Es decorativa: la píldora dice «Prueba esta» y la tarjeta lo repite al
 * lector de pantalla.
 */
export function HintHand() {
  const reduced = useReducedMotion();
  const offset = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      offset.value = 0;
      return;
    }
    const half = { duration: motion.duration.breathe, easing: curves.inOut };
    offset.value = withRepeat(
      withSequence(withTiming(TAP, half), withTiming(0, half)),
      motion.repeat.hint,
    );
  }, [reduced, offset]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <Animated.View style={animated}>
      <Illustration name="hand" size={sizes.icon.lg} />
    </Animated.View>
  );
}
