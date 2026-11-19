import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  ReduceMotion,
} from 'react-native-reanimated';
import { useReducedMotion } from '@/features/motion/useReducedMotion';
import { motion } from '@/theme';

interface EnterStaggerProps {
  /** Posición en la lista: cada una entra un poco después de la anterior. */
  index: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Entrada escalonada de las opciones de una ronda: suben un poco y aparecen,
 * una tras otra (300 ms cada una, 60 ms entre ellas). Así el niño ve que
 * hay opciones nuevas sin que nada salte de golpe.
 *
 * Con «reducir movimiento», un fundido corto y sin desplazamiento.
 *
 * Es un envoltorio aparte a propósito: la animación de entrada no puede
 * compartir vista con el hundimiento de la tarjeta (`PressableSurface`).
 * Para que una ronda nueva vuelva a entrar, el contenedor cambia de `key`.
 */
export function EnterStagger({ index, children, style }: EnterStaggerProps) {
  const reduced = useReducedMotion();
  const entering = reduced
    ? FadeIn.duration(motion.duration.reducedFade).reduceMotion(
        ReduceMotion.Never,
      )
    : FadeInDown.duration(motion.duration.enter)
        .delay(index * motion.duration.stagger)
        .withInitialValues({
          transform: [{ translateY: motion.enterOffset }],
        });

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}
