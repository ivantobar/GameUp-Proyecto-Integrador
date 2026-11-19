import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Badge,
  Icon,
  PressableCard,
  PressableSurface,
  type IconName,
  type PressableBaseProps,
  type TextTone,
} from '@/components/ui';
import type { GameId } from '@/data/types';
import { colors, radii, sizes, spacing, type ThemeColor } from '@/theme';
import { GameIcon } from './GameIcon';
import { gameThemes } from './gameThemes';
import { LevelStars, levelStarsLabel } from './LevelStars';

export type GameCardTone = 'brand' | 'warm' | 'surface';

interface ToneStyle {
  title: TextTone;
  subtitle: TextTone;
  icon: ThemeColor;
  /** Recuadro blanco detrás del ícono (tarjetas destacadas). */
  iconBox: boolean;
}

/** Tonos de las tarjetas de juego, según el mockup de Juegos. */
export const gameCardTones = {
  brand: {
    title: 'sobreOscuro',
    subtitle: 'sobreOscuro',
    icon: colors.verde.oscuro,
    iconBox: true,
  },
  warm: {
    title: 'principal',
    subtitle: 'secundario',
    icon: colors.cafe.oscuro,
    iconBox: true,
  },
  surface: {
    title: 'principal',
    subtitle: 'secundario',
    icon: colors.verde.oscuro,
    iconBox: false,
  },
} as const satisfies Record<GameCardTone, ToneStyle>;

interface GameCardProps extends PressableBaseProps {
  title: string;
  subtitle: string;
  icon: IconName;
  /**
   * Juego de la tarjeta: en vez del ícono de línea muestra su dibujo a
   * color (`GameIcon`), y la tarjeta toma el fondo y el relieve del color
   * del juego (identidad, no estado), para reconocerlo sin leer. Entonces
   * `tone` no se usa.
   */
  game?: GameId;
  tone: GameCardTone;
  /** «Nuevo», «Tarea»… Se muestra en mayúsculas. */
  badge?: string;
  /**
   * Nivel del juego en la escalera (1 a 5): se ve como estrellas, sin
   * números. Sin él, la tarjeta no muestra estrellas.
   */
  level?: number;
}

/** Tarjeta de un juego (pantalla Juegos). Se toca entera. */
export function GameCard({
  title,
  subtitle,
  icon,
  game,
  tone,
  badge,
  level,
  onPress,
  disabled,
  accessibilityHint,
  testID,
}: GameCardProps) {
  const config = gameCardTones[tone];
  const label = [
    title,
    subtitle,
    level === undefined ? undefined : levelStarsLabel(level),
    badge,
  ]
    .filter(Boolean)
    .join('. ');

  const content = (
    <>
      <View style={styles.top}>
        {game ? (
          <GameIcon game={game} />
        ) : (
          <View style={[styles.iconSlot, config.iconBox && styles.iconBox]}>
            <Icon name={icon} size="lg" color={config.icon} />
          </View>
        )}
        {badge ? <Badge label={badge} /> : null}
      </View>
      <AppText variant="bodyStrong" tone={game ? 'principal' : config.title}>
        {title}
      </AppText>
      <AppText variant="support" tone={game ? 'secundario' : config.subtitle}>
        {subtitle}
      </AppText>
      {level === undefined ? null : (
        <View style={styles.stars}>
          <LevelStars level={level} />
        </View>
      )}
    </>
  );

  if (game) {
    const theme = gameThemes[game];
    return (
      <PressableSurface
        colors={{
          background: theme.background,
          pressedBackground: theme.background,
          border: theme.background,
          // El borde al presionar es el verde de la guía (estado).
          pressedBorder: colors.verde.oscuro,
          edge: theme.accent,
        }}
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        testID={testID}
        depth="md"
        pressScale
        fill
        radius={radii.card}
        borderWidth={sizes.borderStrong}
        style={styles.card}
        contentStyle={styles.content}
      >
        {content}
      </PressableSurface>
    );
  }

  return (
    <PressableCard
      tone={tone}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      testID={testID}
      style={styles.card}
    >
      {content}
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  top: {
    flexDirection: 'row',
    // En teléfonos angostos la insignia baja debajo del ícono en vez de
    // salirse de la tarjeta.
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  iconSlot: {
    width: sizes.iconBox,
    height: sizes.iconBox,
    justifyContent: 'center',
  },
  stars: {
    marginTop: spacing.xs,
  },
  iconBox: {
    alignItems: 'center',
    borderRadius: radii.lg,
    backgroundColor: colors.superficie.blanca,
  },
});
