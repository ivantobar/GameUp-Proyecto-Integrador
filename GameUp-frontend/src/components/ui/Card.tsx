import type { ReactNode } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radii, sizes, spacing, type ThemeColor } from '@/theme';
import type { PressableBaseProps } from './types';
import { pressColor, usePressFeedback } from './usePressFeedback';

export type CardTone = 'surface' | 'soft' | 'warm' | 'brand' | 'deep';

interface ToneStyle {
  background: ThemeColor;
  /** Borde al presionar: cambia la forma, no solo el color. */
  pressedBorder: ThemeColor;
}

/** Superficies planas con esquinas redondeadas, sin sombras (regla 4). */
export const cardTones = {
  /** Blanca: la tarjeta por defecto. */
  surface: {
    background: colors.superficie.blanca,
    pressedBorder: colors.verde.oscuro,
  },
  /** Verde suave: seleccionado, notas de la profe. */
  soft: { background: colors.verde.suave, pressedBorder: colors.verde.oscuro },
  /** Naranja suave: avisos y destacados (texto oscuro o café). */
  warm: { background: colors.naranja.suave, pressedBorder: colors.cafe.oscuro },
  /** Verde oscuro: tarjeta destacada («Sigue donde ibas»). Texto blanco. */
  brand: {
    background: colors.verde.oscuro,
    pressedBorder: colors.texto.principal,
  },
  /** Verde profundo: espejo y video. Texto blanco. */
  deep: {
    background: colors.verde.profundo,
    pressedBorder: colors.texto.principal,
  },
} as const satisfies Record<CardTone, ToneStyle>;

interface CardProps {
  tone?: CardTone;
  children: ReactNode;
  /** Solo para ubicar la tarjeta (flex, márgenes). */
  style?: StyleProp<ViewStyle>;
}

/** Tarjeta que no se toca. */
export function Card({ tone = 'surface', children, style }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: cardTones[tone].background },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface PressableCardProps extends PressableBaseProps {
  tone?: CardTone;
  children: ReactNode;
  /** Obligatorio: resume en una frase lo que contiene la tarjeta. */
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

/** Tarjeta que se toca entera (juegos, tareas). */
export function PressableCard({
  tone = 'surface',
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
  testID,
  style,
}: PressableCardProps) {
  const { progress, onPressIn, onPressOut } = usePressFeedback();
  const config = cardTones[tone];

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      testID={testID}
      style={style}
    >
      <Animated.View
        style={[
          styles.base,
          styles.pressableBorder,
          {
            backgroundColor: config.background,
            borderColor: pressColor(
              progress,
              config.background,
              config.pressedBorder,
            ),
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
  pressableBorder: {
    borderWidth: sizes.borderStrong,
    flexGrow: 1,
  },
});
