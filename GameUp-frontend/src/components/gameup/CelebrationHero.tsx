import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  ReduceMotion,
  ZoomIn,
} from 'react-native-reanimated';
import { AppText } from '@/components/ui';
import { useReducedMotion } from '@/features/motion/useReducedMotion';
import { motion, sizes, spacing } from '@/theme';
import { Celebration } from './Celebration';
import { Character } from './Character';
import { Illustration } from './illustrations';

/** Las estrellas premian el intento: siempre tres, nunca una nota. */
const STARS = 3;
/** Pausa antes de la primera estrella y entre una y otra. */
const FIRST_STAR_DELAY = 300;
const BETWEEN_STARS = 250;

interface CelebrationHeroProps {
  /** «¡Muy bien, Lunita!», «¡Lo lograste!». Es el título de la pantalla. */
  cheer: string;
  /** Qué hizo, en una frase: «Dijiste la O». */
  message: string;
  /** Lo que lee el lector de pantalla de las estrellas. */
  starsLabel: string;
}

/**
 * Parte de arriba de las pantallas de «¡Listo!» (sobre verde oscuro): el
 * personaje celebrando con ojos felices, el confeti y tres estrellas que
 * aparecen una a una con un rebote leve. Todo pasa una sola vez y se queda
 * quieto. Con «reducir movimiento», solo un fundido corto.
 */
export function CelebrationHero({
  cheer,
  message,
  starsLabel,
}: CelebrationHeroProps) {
  const reduced = useReducedMotion();
  const starEntering = (index: number) =>
    reduced
      ? FadeIn.duration(motion.duration.reducedFade).reduceMotion(
          ReduceMotion.Never,
        )
      : ZoomIn.delay(FIRST_STAR_DELAY + index * BETWEEN_STARS)
          .springify()
          .duration(motion.spring.gentle.duration)
          .dampingRatio(motion.spring.gentle.dampingRatio);

  return (
    <View style={styles.center}>
      <Celebration
        width={sizes.character.lg + 80}
        height={sizes.character.md + 24}
      >
        <Character mouth="smile" eyes="happy" size="md" />
      </Celebration>

      <View style={styles.stars} accessible accessibilityLabel={starsLabel}>
        {Array.from({ length: STARS }, (_, index) => (
          <Animated.View key={index} entering={starEntering(index)}>
            <Illustration name="estrella" size={sizes.icon.xl + spacing.xs} />
          </Animated.View>
        ))}
      </View>

      <AppText
        variant="display"
        tone="sobreOscuro"
        accessibilityRole="header"
        style={styles.text}
      >
        {cheer}
      </AppText>
      <AppText tone="sobreOscuro" style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  stars: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  text: {
    textAlign: 'center',
  },
});
