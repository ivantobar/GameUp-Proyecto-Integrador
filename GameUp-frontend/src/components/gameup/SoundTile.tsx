import { StyleSheet } from 'react-native';
import {
  AppText,
  PressableSurface,
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
  /** Relieve plano (borde inferior sólido). */
  edge: ThemeColor;
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
    edge: colors.borde.relieve,
  },
  inProgress: {
    background: colors.superficie.blanca,
    pressedBackground: colors.naranja.suave,
    border: colors.marca.naranja,
    edge: colors.cafe.oscuro,
  },
  practiced: {
    background: colors.verde.suave,
    pressedBackground: colors.verde.suave,
    border: colors.verde.oscuro,
    edge: colors.verde.oscuro,
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
  const level = practiceLevel(stars);
  const config = soundTileLevels[level];

  return (
    <PressableSurface
      colors={{ ...config, pressedBorder: config.border }}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={`${letter}. ${practiceLevelLabels[level]}, ${stars} de 3 estrellas`}
      accessibilityHint={accessibilityHint}
      testID={testID}
      depth="md"
      pressScale
      radius={radii.xl}
      borderWidth={sizes.borderStrong + 1}
      style={styles.pressable}
      contentStyle={styles.tile}
    >
      <AppText variant="glyph">{letter}</AppText>
      <StarRow count={stars} />
    </PressableSurface>
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
  },
});
