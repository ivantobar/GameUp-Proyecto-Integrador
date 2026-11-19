import { StyleSheet } from 'react-native';
import { colors, radii, sizes, type IconSize, type ThemeColor } from '@/theme';
import { Icon, type IconName } from './Icon';
import { PressableSurface } from './PressableSurface';
import type { PressableBaseProps } from './types';

export type IconButtonVariant = 'neutral' | 'soft' | 'solid' | 'accent';
export type IconButtonSize = 'sm' | 'md' | 'lg';

interface VariantStyle {
  background: ThemeColor;
  pressedBackground: ThemeColor;
  border: ThemeColor;
  pressedBorder: ThemeColor;
  /** Relieve plano (borde inferior sólido). */
  edge: ThemeColor;
  icon: ThemeColor;
}

export const iconButtonVariants = {
  /** Blanco con borde: volver y cerrar. */
  neutral: {
    background: colors.superficie.blanca,
    pressedBackground: colors.verde.suave,
    border: colors.borde.suave,
    pressedBorder: colors.verde.oscuro,
    edge: colors.relieve.superficie,
    icon: colors.verde.oscuro,
  },
  /** Verde suave: parlante de las instrucciones. */
  soft: {
    background: colors.verde.suave,
    pressedBackground: colors.verde.suave,
    border: colors.borde.suave,
    pressedBorder: colors.verde.oscuro,
    edge: colors.relieve.verdeSuave,
    icon: colors.verde.oscuro,
  },
  /** Verde oscuro: reproducir el modelo, oír el sonido en Busca la boca. */
  solid: {
    background: colors.verde.oscuro,
    pressedBackground: colors.texto.principal,
    border: colors.verde.oscuro,
    pressedBorder: colors.texto.principal,
    edge: colors.verde.profundo,
    icon: colors.texto.sobreOscuro,
  },
  /** Naranja con ícono oscuro: reproducir la voz del niño. */
  accent: {
    background: colors.marca.naranja,
    pressedBackground: colors.naranja.presionado,
    border: colors.marca.naranja,
    pressedBorder: colors.naranja.presionado,
    edge: colors.relieve.naranja,
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
  const config = iconButtonVariants[variant];
  const diameter = sizes.iconButton[size];
  const palette = disabled
    ? {
        background: colors.marca.gris,
        pressedBackground: colors.marca.gris,
        border: colors.borde.suave,
        pressedBorder: colors.borde.suave,
        edge: colors.borde.suave,
      }
    : config;

  return (
    <PressableSurface
      colors={palette}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      testID={testID}
      depth="sm"
      radius={radii.pill}
      borderWidth={sizes.border}
      contentStyle={[styles.base, { width: diameter, height: diameter }]}
    >
      <Icon
        name={icon}
        size={iconSizeFor[size]}
        color={disabled ? colors.texto.secundario : config.icon}
      />
    </PressableSurface>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
