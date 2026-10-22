import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Badge,
  Icon,
  PressableCard,
  type IconName,
  type PressableBaseProps,
  type TextTone,
} from '@/components/ui';
import { colors, radii, sizes, spacing, type ThemeColor } from '@/theme';

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
  tone: GameCardTone;
  /** «Nuevo», «Tarea»… Se muestra en mayúsculas. */
  badge?: string;
}

/** Tarjeta de un juego (pantalla Juegos). Se toca entera. */
export function GameCard({
  title,
  subtitle,
  icon,
  tone,
  badge,
  onPress,
  disabled,
  accessibilityHint,
  testID,
}: GameCardProps) {
  const config = gameCardTones[tone];
  const label = [title, subtitle, badge].filter(Boolean).join('. ');

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
      <View style={styles.top}>
        <View style={[styles.iconSlot, config.iconBox && styles.iconBox]}>
          <Icon name={icon} size="lg" color={config.icon} />
        </View>
        {badge ? <Badge label={badge} /> : null}
      </View>
      <AppText variant="bodyStrong" tone={config.title}>
        {title}
      </AppText>
      <AppText variant="support" tone={config.subtitle}>
        {subtitle}
      </AppText>
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
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
  iconBox: {
    alignItems: 'center',
    borderRadius: radii.lg,
    backgroundColor: colors.superficie.blanca,
  },
});
