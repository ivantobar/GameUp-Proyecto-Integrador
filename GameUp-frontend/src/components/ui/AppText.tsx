import { Text, type TextProps } from 'react-native';
import { colors, typography, type TextVariant } from '@/theme';

/** Colores de texto permitidos, con su uso. */
export const textTones = {
  principal: colors.texto.principal,
  secundario: colors.texto.secundario,
  /** Verde oscuro: enlaces y texto de marca. */
  marca: colors.verde.oscuro,
  /** Café: textos sobre naranja suave. */
  cafe: colors.cafe.oscuro,
  /** Blanco: solo sobre verde oscuro o verde profundo. */
  sobreOscuro: colors.texto.sobreOscuro,
} as const;

export type TextTone = keyof typeof textTones;

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
}

/**
 * Texto con la tipografía de la guía. `style` sirve solo para ubicar el texto
 * (márgenes, alineación). El tamaño y el color salen de `variant` y `tone`.
 */
export function AppText({
  variant = 'body',
  tone = 'principal',
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[typography[variant], { color: textTones[tone] }, style]}
      {...rest}
    />
  );
}
