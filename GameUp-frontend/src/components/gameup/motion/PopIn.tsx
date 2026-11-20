import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  ReduceMotion,
  ZoomIn,
} from 'react-native-reanimated';
import { useReducedMotion } from '@/features/motion/useReducedMotion';
import { motion } from '@/theme';

interface PopInProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Aparición breve y alegre (crece desde pequeño con un rebote leve, 300 ms)
 * para lo que llega como premio: «¡Muy bien!», un paso que se acomoda en su
 * casilla. Se anima al montarse; para repetirlo, cambia la `key`.
 *
 * Con «reducir movimiento», un fundido corto.
 */
export function PopIn({ children, style }: PopInProps) {
  const reduced = useReducedMotion();
  const entering = reduced
    ? FadeIn.duration(motion.duration.reducedFade).reduceMotion(
        ReduceMotion.Never,
      )
    : ZoomIn.springify()
        .duration(motion.spring.gentle.duration)
        .dampingRatio(motion.spring.gentle.dampingRatio);

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}
