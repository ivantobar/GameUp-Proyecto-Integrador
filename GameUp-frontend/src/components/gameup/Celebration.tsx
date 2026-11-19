import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  ReduceMotion,
} from 'react-native-reanimated';
import Svg, { Circle, Rect } from 'react-native-svg';
import { useReducedMotion } from '@/features/motion/useReducedMotion';
import { colors, motion } from '@/theme';

interface CelebrationProps {
  children: ReactNode;
  width: number;
  height: number;
}

/**
 * Confeti alrededor del personaje (pantallas de «¡Listo!»). Cae un poco y
 * aparece UNA sola vez, despacio (600 ms), y se queda quieto: sin destellos
 * ni parpadeos (riesgo de fotosensibilidad). Con «reducir movimiento», un
 * fundido corto. Es decorativo.
 */
export function Celebration({ children, width, height }: CelebrationProps) {
  const reduced = useReducedMotion();
  const entering = reduced
    ? FadeIn.duration(motion.duration.reducedFade).reduceMotion(
        ReduceMotion.Never,
      )
    : FadeInDown.duration(
        motion.duration.celebrate + motion.duration.state * 2,
      );
  return (
    <View style={{ width, height }}>
      <Animated.View
        entering={entering}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Svg
          width={width}
          height={height}
          viewBox="0 0 300 200"
          style={StyleSheet.absoluteFill}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Circle cx={40} cy={60} r={6} fill={colors.superficie.blanca} />
          <Circle cx={262} cy={70} r={7} fill={colors.marca.naranja} />
          <Circle cx={60} cy={150} r={5} fill={colors.marca.naranja} />
          <Circle cx={150} cy={8} r={4} fill={colors.superficie.blanca} />
          <Circle cx={250} cy={150} r={4} fill={colors.verde.suave} />
          <Rect
            x={20}
            y={110}
            width={14}
            height={5}
            rx={2.5}
            fill={colors.verde.suave}
            transform="rotate(-30 27 112)"
          />
          <Rect
            x={270}
            y={110}
            width={14}
            height={5}
            rx={2.5}
            fill={colors.marca.naranja}
            transform="rotate(60 277 112)"
          />
        </Svg>
      </Animated.View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
