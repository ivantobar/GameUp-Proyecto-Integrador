import { StyleSheet, View } from 'react-native';
import { colors, radii, sizes, spacing, type ThemeColor } from '@/theme';
import { AppText } from './AppText';

export type ProgressTone = 'official' | 'practice';

/**
 * Dos tonos para que nunca se confundan:
 * - `official`: progreso oficial (solo actividades validadas). Verde de marca,
 *   como pide la guía para las barras de progreso.
 * - `practice`: estrellas de práctica. Naranja, el color de las estrellas.
 */
export const progressTones = {
  official: colors.marca.verde,
  practice: colors.marca.naranja,
} as const satisfies Record<ProgressTone, ThemeColor>;

/** Porcentaje entero entre 0 y 100. Con total 0, el avance es 0 %. */
export function toPercent(value: number, max: number): number {
  if (max <= 0) return 0;
  const ratio = Math.min(Math.max(value / max, 0), 1);
  return Math.round(ratio * 100);
}

interface ProgressTrackProps {
  /** De 0 a 100. */
  percent: number;
  tone: ProgressTone;
}

/**
 * Solo la barra (riel y relleno), sin texto ni accesibilidad: la usa un
 * componente que ya anuncia el valor (por ejemplo, la tarjeta de un tema).
 */
export function ProgressTrack({ percent, tone }: ProgressTrackProps) {
  return (
    <View
      style={styles.track}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={[
          styles.fill,
          { width: `${percent}%`, backgroundColor: progressTones[tone] },
        ]}
      />
    </View>
  );
}

interface ProgressBarProps {
  value: number;
  max: number;
  /** Texto visible y leído: «Llevas 3 de 5 vocales». */
  label: string;
  tone: ProgressTone;
}

/** Barra con su texto encima, anunciada como barra de progreso. */
export function ProgressBar({ value, max, label, tone }: ProgressBarProps) {
  const safeMax = Math.max(max, 1);
  const clamped = Math.min(Math.max(value, 0), safeMax);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: safeMax, now: clamped, text: label }}
      style={styles.container}
    >
      <AppText variant="bodyStrong">{label}</AppText>
      <ProgressTrack percent={toPercent(clamped, safeMax)} tone={tone} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  track: {
    height: sizes.progressBar,
    borderRadius: radii.pill,
    // Verde suave, como en la imagen de referencia de «Mi progreso». Las
    // barras siempre van dentro de una tarjeta blanca.
    backgroundColor: colors.verde.suave,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
  },
});
