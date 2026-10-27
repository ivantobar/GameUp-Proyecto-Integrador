import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { colors } from '@/theme';

interface CelebrationProps {
  children: ReactNode;
  width: number;
  height: number;
}

/**
 * Confeti alrededor del personaje (paso «Listo»). Es un dibujo fijo y
 * decorativo: no se mueve, así que no molesta con «reducir movimiento».
 */
export function Celebration({ children, width, height }: CelebrationProps) {
  return (
    <View style={{ width, height }}>
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
