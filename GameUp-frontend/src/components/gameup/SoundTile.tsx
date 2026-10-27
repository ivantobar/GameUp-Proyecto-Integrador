import { Animated, Pressable, StyleSheet } from 'react-native';
import {
  AppText,
  pressColor,
  usePressFeedback,
  type PressableBaseProps,
} from '@/components/ui';
import { colors, radii, sizes, spacing, type ThemeColor } from '@/theme';
import type { StarCount } from '@/data/types';
import {
  practiceLevel,
  practiceLevelLabels,
  type PracticeLevel,
} from '@/features/speak/practice';
import { StarRow } from './StarRow';

interface LevelStyle {
  background: ThemeColor;
  pressedBackground: ThemeColor;
  border: ThemeColor;
}

/**
 * Tres estados de la ficha (mockup 3). Además del color, cambian el número
 * de estrellas llenas y la descripción que oye el lector de pantalla.
 */
export const soundTileLevels = {
  notPracticed: {
    background: colors.superficie.blanca,
    pressedBackground: colors.verde.suave,
    border: colors.borde.suave,
  },
  inProgress: {
    background: colors.superficie.blanca,
    pressedBackground: colors.naranja.suave,
    border: colors.marca.naranja,
  },
  practiced: {
    background: colors.verde.suave,
    pressedBackground: colors.verde.suave,
    border: colors.verde.oscuro,
  },
} as const satisfies Record<PracticeLevel, LevelStyle>;

interface SoundTileProps extends PressableBaseProps {
  /** Letra que se muestra, por ejemplo «A». */
  letter: string;
  stars: StarCount;
}

/** Ficha grande de un sonido con sus estrellas de práctica. */
export function SoundTile({
  letter,
  stars,
  onPress,
  disabled = false,
  accessibilityHint,
  testID,
}: SoundTileProps) {
  const { progress, onPressIn, onPressOut } = usePressFeedback();
  const level = practiceLevel(stars);
  const config = soundTileLevels[level];

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${letter}. ${practiceLevelLabels[level]}, ${stars} de 3 estrellas`}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      testID={testID}
      style={styles.pressable}
    >
      <Animated.View
        style={[
          styles.tile,
          {
            borderColor: config.border,
            backgroundColor: pressColor(
              progress,
              config.background,
              config.pressedBackground,
            ),
          },
        ]}
      >
        <AppText variant="glyph">{letter}</AppText>
        <StarRow count={stars} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flexBasis: '30%',
    flexGrow: 0,
  },
  tile: {
    minHeight: sizes.soundTile,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: sizes.borderStrong + 1,
  },
});
