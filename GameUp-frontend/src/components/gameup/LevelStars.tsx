import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  ReduceMotion,
  ZoomIn,
} from 'react-native-reanimated';
import { useReducedMotion } from '@/features/motion/useReducedMotion';
import { motion, sizes, spacing, type IconSize } from '@/theme';
import { Illustration } from './illustrations';

/** Pausa antes de la primera estrella y entre una y otra (`appear`). */
const FIRST_STAR_DELAY = 300;
const BETWEEN_STARS = 250;

interface LevelStarsProps {
  /** Nivel alcanzado en la escalera (1 a 5): una estrella por nivel. */
  level: number;
  size?: IconSize;
  /**
   * Las estrellas aparecen una a una con un rebote leve (celebración de
   * nivel). Con «reducir movimiento», un fundido corto.
   */
  appear?: boolean;
}

/**
 * Nivel de un juego como estrellas: solo las ganadas, sin estrellas vacías,
 * números ni «te falta» (sin presión). Es decorativa: quien la contiene
 * dice cuántas son al lector de pantalla.
 */
export function LevelStars({
  level,
  size = 'sm',
  appear = false,
}: LevelStarsProps) {
  const reduced = useReducedMotion();
  const count = Math.max(1, Math.min(5, Math.trunc(level)));
  const entering = (index: number) =>
    !appear
      ? undefined
      : reduced
        ? FadeIn.duration(motion.duration.reducedFade).reduceMotion(
            ReduceMotion.Never,
          )
        : ZoomIn.delay(FIRST_STAR_DELAY + index * BETWEEN_STARS)
            .springify()
            .duration(motion.spring.gentle.duration)
            .dampingRatio(motion.spring.gentle.dampingRatio);
  return (
    <View
      style={styles.row}
      testID="level-stars"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: count }, (_, index) => (
        <Animated.View key={index} entering={entering(index)}>
          {/* Estrella dibujada con contorno oscuro: se distingue sobre
              blanco y sobre los fondos de color (la naranja plana daba 2:1). */}
          <Illustration name="estrellaIcono" size={sizes.icon[size]} />
        </Animated.View>
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
