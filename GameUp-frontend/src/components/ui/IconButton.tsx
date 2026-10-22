import { Animated, Pressable, StyleSheet } from 'react-native';
import { colors, radii, sizes, type IconSize, type ThemeColor } from '@/theme';
import { Icon, type IconName } from './Icon';
import type { PressableBaseProps } from './types';
import { pressColor, usePressFeedback } from './usePressFeedback';

export type IconButtonVariant = 'neutral' | 'soft' | 'solid' | 'accent';
export type IconButtonSize = 'sm' | 'md' | 'lg';

interface VariantStyle {
  background: ThemeColor;
  pressedBackground: ThemeColor;
  border: ThemeColor;
  pressedBorder: ThemeColor;
  icon: ThemeColor;
}

export const iconButtonVariants = {
  /** Blanco con borde: volver y cerrar. */
  neutral: {
    background: colors.superficie.blanca,
    pressedBackground: colors.verde.suave,
    border: colors.borde.suave,
    pressedBorder: colors.verde.oscuro,
    icon: colors.verde.oscuro,
  },
  /** Verde suave: parlante de las instrucciones. */
  soft: {
    background: colors.verde.suave,
    pressedBackground: colors.verde.suave,
    border: colors.borde.suave,
    pressedBorder: colors.verde.oscuro,
    icon: colors.verde.oscuro,
  },
  /** Verde oscuro: reproducir el modelo, oír el sonido en Busca la boca. */
  solid: {
    background: colors.verde.oscuro,
    pressedBackground: colors.texto.principal,
    border: colors.verde.oscuro,
    pressedBorder: colors.texto.principal,
    icon: colors.texto.sobreOscuro,
  },
  /** Naranja con ícono oscuro: reproducir la voz del niño. */
  accent: {
    background: colors.marca.naranja,
    pressedBackground: colors.naranja.presionado,
    border: colors.marca.naranja,
    pressedBorder: colors.naranja.presionado,
    icon: colors.texto.principal,
  },
} as const satisfies Record<IconButtonVariant, VariantStyle>;

const iconSizeFor: Record<IconButtonSize, IconSize> = {
  sm: 'sm',
  md: 'md',
  lg: 'xl',
};

interface IconButtonProps extends PressableBaseProps {
  icon: IconName;
  /** Obligatorio: el ícono solo no le dice nada a un lector de pantalla. */
  accessibilityLabel: string;
  variant?: IconButtonVariant;
  /** sm 44 px (mínimo táctil), md 56 px, lg 88 px. */
  size?: IconButtonSize;
}

/** Botón circular con un ícono. */
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = 'neutral',
  size = 'md',
  disabled = false,
  accessibilityHint,
  testID,
}: IconButtonProps) {
  const { progress, onPressIn, onPressOut } = usePressFeedback();
  const config = iconButtonVariants[variant];
  const diameter = sizes.iconButton[size];

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
    >
      <Animated.View
        style={[
          styles.base,
          {
            width: diameter,
            height: diameter,
            backgroundColor: disabled
              ? colors.marca.gris
              : pressColor(
                  progress,
                  config.background,
                  config.pressedBackground,
                ),
            borderColor: disabled
              ? colors.borde.suave
              : pressColor(progress, config.border, config.pressedBorder),
          },
        ]}
      >
        <Icon
          name={icon}
          size={iconSizeFor[size]}
          color={disabled ? colors.texto.secundario : config.icon}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: sizes.border,
  },
});
