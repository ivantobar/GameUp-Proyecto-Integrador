import { StyleSheet, View } from 'react-native';
import { AppText, Icon, type IconName, type TextTone } from '@/components/ui';
import { colors, radii, spacing, type ThemeColor } from '@/theme';

export type HintPillKind = 'hint' | 'correct';

/** Mismos colores que la píldora de «Busca la boca» (MouthOption). */
export const hintPillStyles = {
  /** Pista: «Prueba esta», con la manito. */
  hint: {
    background: colors.verde.suave,
    text: 'marca',
    icon: 'hand',
    iconColor: colors.verde.oscuro,
  },
  /** Acierto: «¡Muy bien!», con el ✓. */
  correct: {
    background: colors.verde.oscuro,
    text: 'sobreOscuro',
    icon: 'check',
    iconColor: colors.texto.sobreOscuro,
  },
} as const satisfies Record<
  HintPillKind,
  {
    background: ThemeColor;
    text: TextTone;
    icon: IconName;
    iconColor: ThemeColor;
  }
>;

interface HintPillProps {
  kind: HintPillKind;
  label: string;
}

/**
 * Píldora de pista o de acierto. Dice el estado con palabras e ícono, no
 * solo con color. Va dentro de una tarjeta tocable, que repite el estado en
 * su `accessibilityLabel`.
 */
export function HintPill({ kind, label }: HintPillProps) {
  const config = hintPillStyles[kind];
  return (
    <View style={[styles.pill, { backgroundColor: config.background }]}>
      <Icon name={config.icon} size="sm" color={config.iconColor} />
      <AppText variant="bodyStrong" tone={config.text}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
  },
});
