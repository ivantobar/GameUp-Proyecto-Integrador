import { StyleSheet, View } from 'react-native';
import { Icon } from '@/components/ui';
import { colors, spacing, type IconSize } from '@/theme';

interface LevelStarsProps {
  /** Nivel alcanzado en la escalera (1 a 5): una estrella por nivel. */
  level: number;
  size?: IconSize;
}

/**
 * Nivel de un juego como estrellas: solo las ganadas, sin estrellas vacías,
 * números ni «te falta» (sin presión). Es decorativa: quien la contiene
 * dice cuántas son al lector de pantalla.
 */
export function LevelStars({ level, size = 'sm' }: LevelStarsProps) {
  const count = Math.max(1, Math.min(5, Math.trunc(level)));
  return (
    <View
      style={styles.row}
      testID="level-stars"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: count }, (_, index) => (
        <Icon
          key={index}
          name="star"
          size={size}
          color={colors.marca.naranja}
        />
      ))}
    </View>
  );
}

/** «3 estrellas» (solo para el lector de pantalla). */
export function levelStarsLabel(level: number): string {
  const count = Math.max(1, Math.min(5, Math.trunc(level)));
  return count === 1 ? '1 estrella' : `${count} estrellas`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs,
  },
});
