import { StyleSheet, View } from 'react-native';
import { colors, radii, sizes, spacing } from '@/theme';

interface ProgressDotsProps {
  total: number;
  /** Posición actual, empezando en 0. */
  current: number;
}

/**
 * Puntos de avance (Busca la boca). El estado se distingue por la forma:
 * - hecho: punto relleno;
 * - actual: píldora alargada;
 * - pendiente: punto con borde, sin relleno.
 */
export function ProgressDots({ total, current }: ProgressDotsProps) {
  const label = `Vas en la ${current + 1} de ${total}`;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 1, max: total, now: current + 1, text: label }}
      style={styles.row}
    >
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index < current && styles.done,
            index === current && styles.current,
            index > current && styles.pending,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: sizes.dot,
    height: sizes.dot,
    borderRadius: radii.pill,
  },
  done: {
    backgroundColor: colors.verde.oscuro,
  },
  current: {
    width: sizes.dotActiveWidth,
    backgroundColor: colors.marca.naranja,
  },
  pending: {
    backgroundColor: colors.superficie.blanca,
    borderWidth: sizes.border,
    borderColor: colors.borde.suave,
  },
});
