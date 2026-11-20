import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type AccessibilityRole,
  type AccessibilityState,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {
  depth as depthTokens,
  motion,
  type DepthSize,
  type ThemeColor,
} from '@/theme';
import { useAdultSurfaces } from './AdultSurfaces';
import type { PressableBaseProps } from './types';
import { usePressFeedback } from './usePressFeedback';

/**
 * Alto del relieve de una superficie: el del niño o, en las pantallas de
 * adultos (`AdultSurfaces`), el discreto. Lo usan los botones de tamaño fijo
 * (IconButton, MicButton) para medir su alto total.
 */
export function surfaceDepth(
  depth: DepthSize | 'none',
  adult: boolean,
): number {
  if (depth === 'none') return 0;
  return adult ? depthTokens.adult[depth] : depthTokens[depth];
}

/** Colores de una superficie tocable, en estado normal y presionado. */
export interface SurfaceColors {
  background: ThemeColor;
  pressedBackground: ThemeColor;
  border: ThemeColor;
  pressedBorder: ThemeColor;
  /** Borde inferior del relieve. */
  edge: ThemeColor;
}

export interface PressableSurfaceProps extends PressableBaseProps {
  colors: SurfaceColors;
  children: ReactNode;
  accessibilityLabel: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  /** Alto del relieve; `none` para una superficie plana (enlaces). */
  depth?: DepthSize | 'none';
  radius: number;
  borderWidth: number;
  borderStyle?: 'solid' | 'dashed';
  /** Rebote leve al presionar (tarjetas de juego del niño). */
  pressScale?: boolean;
  /**
   * La cara crece para llenar a la superficie (tarjetas del mismo alto en
   * una fila). Solo dentro de un contenedor con alto definido o dentro del
   * contenido desplazable de `Screen`; NUNCA en el encabezado ni en el pie
   * de botones: ahí crecería hasta ocupar toda la pantalla.
   */
  fill?: boolean;
  /** Opciones que ya no se pueden tocar en la ronda (más pálidas). */
  opacity?: number;
  /** Ubica la superficie (flex, márgenes, ancho). */
  style?: StyleProp<ViewStyle>;
  /** Distribuye el contenido de la cara (padding, dirección, alineación). */
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Base de todo lo que se toca con relieve plano: una «cara» con su borde y,
 * debajo, un borde inferior sólido más oscuro (sin sombras ni degradados,
 * regla de la guía). Al presionar, la cara baja y tapa parte del relieve:
 * se siente como un botón físico.
 *
 * Deshabilitada, la superficie queda plana: el relieve dice «se puede
 * tocar». El estado nunca depende solo del relieve; también lo dicen el
 * color, el borde y `accessibilityState`.
 */
export function PressableSurface({
  colors: palette,
  children,
  onPress,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
  testID,
  depth = 'sm',
  radius,
  borderWidth,
  borderStyle = 'solid',
  pressScale = false,
  fill = false,
  opacity = 1,
  style,
  contentStyle,
}: PressableSurfaceProps) {
  const { progress, onPressIn, onPressOut } = usePressFeedback();
  // El espacio del relieve se reserva siempre (también deshabilitada): así
  // un botón que se habilita no cambia de alto ni mueve la pantalla.
  const adult = useAdultSurfaces();
  const reserved = surfaceDepth(depth, adult);
  const edge = disabled ? 0 : reserved;
  const sink =
    edge === 0 ? 0 : adult ? depthTokens.adult.pressed : depthTokens.pressed;
  // En las pantallas de adultos no hay rebote: se ven sobrias.
  const scaleTo = pressScale && !adult ? motion.pressScale : 1;

  const faceStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [palette.background, palette.pressedBackground],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [palette.border, palette.pressedBorder],
    ),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, sink]) },
      { scale: interpolate(progress.value, [0, 1], [1, scaleTo]) },
    ],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, ...accessibilityState }}
      testID={testID}
      style={[{ opacity }, style]}
    >
      <View style={[fill && styles.fill, { paddingBottom: reserved }]}>
        {edge > 0 ? (
          <View
            style={[
              styles.edge,
              {
                top: edge,
                borderRadius: radius,
                backgroundColor: palette.edge,
              },
            ]}
          />
        ) : null}
        <Animated.View
          style={[
            fill && styles.fill,
            { borderRadius: radius, borderWidth, borderStyle },
            contentStyle,
            faceStyle,
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Pressable>
  );
}

/**
 * Sin `fill`, ninguna vista de la superficie tiene `flexGrow`: mide lo que
 * su contenido. (Con `flexGrow` en una zona sin alto fijo, como el
 * encabezado, Yoga la estira hasta llenar la pantalla.)
 */
const styles = StyleSheet.create({
  fill: {
    flexGrow: 1,
  },
  /** El relieve: misma forma que la cara, corrido hacia abajo. */
  edge: {
    ...StyleSheet.absoluteFill,
  },
});
