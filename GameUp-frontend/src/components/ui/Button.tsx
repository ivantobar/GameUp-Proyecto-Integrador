import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
} from 'react-native';
import { colors, radii, sizes, spacing, type ThemeColor } from '@/theme';
import { AppText, textTones, type TextTone } from './AppText';
import { Icon, type IconName } from './Icon';
import type { PressableBaseProps } from './types';
import { pressColor, usePressFeedback } from './usePressFeedback';

export type ButtonVariant =
  'primary' | 'secondary' | 'accent' | 'link' | 'soft' | 'warm';
export type ButtonSize = 'regular' | 'large';

interface VariantStyle {
  background: ThemeColor;
  pressedBackground: ThemeColor;
  border: ThemeColor;
  pressedBorder: ThemeColor;
  text: TextTone;
  /** Color del ícono; si no se indica, el del texto. */
  icon?: ThemeColor;
  underline: boolean;
}

/**
 * Variantes del botón (abierto/cerrado: una variante nueva es una entrada
 * nueva en este mapa, no un `if` en el componente).
 * Los estados normal y presionado salen de la guía de estilos.
 */
export const buttonVariants = {
  /** Acción principal. Verde oscuro (regla de la guía). */
  primary: {
    background: colors.verde.oscuro,
    pressedBackground: colors.texto.principal,
    border: colors.verde.oscuro,
    pressedBorder: colors.texto.principal,
    text: 'sobreOscuro',
    underline: false,
  },
  /** Acción secundaria: «Anterior», «Practicar más». */
  secondary: {
    background: colors.superficie.blanca,
    pressedBackground: colors.verde.suave,
    border: colors.verde.oscuro,
    pressedBorder: colors.verde.profundo,
    text: 'marca',
    underline: false,
  },
  /**
   * Naranja con texto oscuro (nunca blanco). Excepción aprobada: es la acción
   * principal solo cuando está sobre una superficie verde oscuro, donde un
   * botón verde oscuro no se vería («Continuar» en Inicio, «Otro sonido»).
   */
  accent: {
    background: colors.marca.naranja,
    pressedBackground: colors.naranja.presionado,
    border: colors.marca.naranja,
    pressedBorder: colors.naranja.presionado,
    text: 'principal',
    underline: false,
  },
  /** Enlace: «Ver otra vez cómo se hace». */
  link: {
    background: colors.transparente,
    pressedBackground: colors.verde.suave,
    border: colors.transparente,
    pressedBorder: colors.verde.suave,
    text: 'marca',
    underline: true,
  },
  /** Apoyo verde suave: «Oír el sonido» (mockup 4). */
  soft: {
    background: colors.verde.suave,
    pressedBackground: colors.verde.suave,
    border: colors.verde.suave,
    pressedBorder: colors.verde.oscuro,
    text: 'principal',
    icon: colors.verde.oscuro,
    underline: false,
  },
  /** Apoyo naranja suave: «Ver el gesto» (mockup 4). */
  warm: {
    background: colors.naranja.suave,
    pressedBackground: colors.naranja.suave,
    border: colors.naranja.suave,
    pressedBorder: colors.cafe.oscuro,
    text: 'principal',
    icon: colors.cafe.oscuro,
    underline: false,
  },
} as const satisfies Record<ButtonVariant, VariantStyle>;

/** Deshabilitado: gris, con borde y texto de apoyo (no solo más pálido). */
export const buttonDisabled = {
  background: colors.marca.gris,
  border: colors.borde.suave,
  text: 'secundario',
} as const satisfies Pick<VariantStyle, 'background' | 'border' | 'text'>;

interface ButtonProps extends PressableBaseProps {
  label: string;
  variant?: ButtonVariant;
  /** `large` (64 px) para la acción principal en las pantallas del niño. */
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'regular',
  icon,
  loading = false,
  disabled = false,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const { progress, onPressIn, onPressOut } = usePressFeedback();
  const config = buttonVariants[variant];
  const isDisabled = disabled || loading;
  const isLink = variant === 'link';

  const textTone: TextTone = disabled ? buttonDisabled.text : config.text;
  const iconColor =
    !disabled && 'icon' in config ? config.icon : textTones[textTone];
  const background =
    disabled && !isLink
      ? buttonDisabled.background
      : pressColor(progress, config.background, config.pressedBackground);
  const border =
    disabled && !isLink
      ? buttonDisabled.border
      : pressColor(progress, config.border, config.pressedBorder);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
    >
      <Animated.View
        style={[
          styles.base,
          {
            minHeight: size === 'large' ? sizes.buttonLarge : sizes.button,
            backgroundColor: background,
            borderColor: border,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textTones[textTone]} />
        ) : (
          <>
            {icon ? <Icon name={icon} color={iconColor} /> : null}
            <AppText
              variant="button"
              tone={textTone}
              style={
                config.underline && !disabled ? styles.underline : undefined
              }
            >
              {label}
            </AppText>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: sizes.borderStrong,
  },
  underline: {
    textDecorationLine: 'underline',
  },
});
