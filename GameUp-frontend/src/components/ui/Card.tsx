import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radii, sizes, spacing, type ThemeColor } from '@/theme';
import { PressableSurface } from './PressableSurface';
import type { PressableBaseProps } from './types';

export type CardTone = 'surface' | 'soft' | 'warm' | 'brand' | 'deep';

interface ToneStyle {
  background: ThemeColor;
  /** Borde al presionar: cambia la forma, no solo el color. */
  pressedBorder: ThemeColor;
  /** Relieve plano de la tarjeta que se toca (borde inferior sólido). */
  edge: ThemeColor;
}

/**
 * Superficies con esquinas redondeadas, sin sombras ni degradados (regla de
 * la guía). La tarjeta que solo se lee es plana; la que se toca lleva
 * relieve plano (un borde inferior sólido): así se distingue a simple vista
 * lo que se puede tocar.
 */
export const cardTones = {
  /** Blanca: la tarjeta por defecto. */
  surface: {
    background: colors.superficie.blanca,
    pressedBorder: colors.verde.oscuro,
    edge: colors.relieve.superficie,
  },
  /** Verde suave: seleccionado, notas de la profe. */
  soft: {
    background: colors.verde.suave,
    pressedBorder: colors.verde.oscuro,
    edge: colors.relieve.verdeSuave,
  },
  /** Naranja suave: avisos y destacados (texto oscuro o café). */
  warm: {
    background: colors.naranja.suave,
    pressedBorder: colors.cafe.oscuro,
    edge: colors.relieve.naranjaSuave,
  },
  /** Verde oscuro: tarjeta destacada («Sigue donde ibas»). Texto blanco. */
  brand: {
    background: colors.verde.oscuro,
    pressedBorder: colors.texto.principal,
    edge: colors.verde.profundo,
  },
  /** Verde profundo: espejo y video. Texto blanco. */
  deep: {
    background: colors.verde.profundo,
    pressedBorder: colors.texto.principal,
    edge: colors.texto.principal,
  },
} as const satisfies Record<CardTone, ToneStyle>;

interface CardProps {
  tone?: CardTone;
  children: ReactNode;
  /** Solo para ubicar la tarjeta (flex, márgenes). */
  style?: StyleProp<ViewStyle>;
}

/** Tarjeta que no se toca (plana). */
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

/** Tarjeta que se toca entera (juegos, tareas), con relieve plano. */
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
  const config = cardTones[tone];

  return (
    <PressableSurface
      colors={{
        background: config.background,
        pressedBackground: config.background,
        // Sin presionar, el borde es del color de la tarjeta (no se ve).
        border: config.background,
        pressedBorder: config.pressedBorder,
        edge: config.edge,
      }}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      testID={testID}
      depth="md"
      radius={radii.xl}
      borderWidth={sizes.borderStrong}
      style={style}
      contentStyle={styles.base}
    >
      {children}
    </PressableSurface>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
});
