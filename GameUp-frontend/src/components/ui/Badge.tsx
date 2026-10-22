import { StyleSheet, View } from 'react-native';
import { colors, radii, spacing, type ThemeColor } from '@/theme';
import { AppText, type TextTone } from './AppText';

export type BadgeTone = 'accent' | 'brand' | 'neutral';

export const badgeTones = {
  /** NUEVA, NUEVO, TAREA: naranja con texto oscuro. */
  accent: { background: colors.marca.naranja, text: 'principal' },
  /** Información positiva: verde suave con texto verde oscuro. */
  brand: { background: colors.verde.suave, text: 'marca' },
  /** «Próximamente», «Fase 2»: gris con texto de apoyo. */
  neutral: { background: colors.marca.gris, text: 'secundario' },
} as const satisfies Record<
  BadgeTone,
  { background: ThemeColor; text: TextTone }
>;

interface BadgeProps {
  /** Se escribe normal («Nueva»); se muestra en mayúsculas. */
  label: string;
  tone?: BadgeTone;
}

/** Insignia de texto. Nunca comunica el estado solo con color: lleva palabra. */
export function Badge({ label, tone = 'accent' }: BadgeProps) {
  const config = badgeTones[tone];
  return (
    // El contenedor en fila hace que la píldora mida lo que su texto, tanto
    // dentro de una columna como de una fila.
    <View style={styles.wrapper}>
      <View style={[styles.base, { backgroundColor: config.background }]}>
        <AppText variant="label" tone={config.text}>
          {label}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
  },
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
  },
});
