import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Card,
  Icon,
  ProgressTrack,
  type TextTone,
} from '@/components/ui';
import { colors, radii, sizes, spacing, type ThemeColor } from '@/theme';
import type { ModuleBadgeTone, ModuleDefinition } from '../modules';

const badgeTones = {
  neutral: {
    background: colors.marca.gris,
    icon: colors.verde.oscuro,
    text: 'marca',
  },
  soft: {
    background: colors.verde.suave,
    icon: colors.verde.oscuro,
    text: 'marca',
  },
  warm: {
    background: colors.naranja.suave,
    icon: colors.cafe.oscuro,
    text: 'cafe',
  },
} as const satisfies Record<
  ModuleBadgeTone,
  { background: ThemeColor; icon: ThemeColor; text: TextTone }
>;

interface ModuleProgressCardProps {
  module: ModuleDefinition;
  /** De 0 a 100. */
  percent: number;
}

/**
 * Tarjeta de un tema en «Mi progreso»: recuadro con símbolo, nombre,
 * porcentaje y barra. El valor se dice con número y con barra, no solo
 * con color.
 */
export function ModuleProgressCard({
  module,
  percent,
}: ModuleProgressCardProps) {
  const tone = badgeTones[module.tone];
  const label = `${module.title}, ${percent} por ciento`;

  return (
    <Card>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityValue={{ min: 0, max: 100, now: percent, text: label }}
        style={styles.content}
      >
        <View style={styles.row}>
          <View style={[styles.badge, { backgroundColor: tone.background }]}>
            {module.symbol.kind === 'icon' ? (
              <Icon name={module.symbol.icon} color={tone.icon} />
            ) : (
              <AppText variant="bodyStrong" tone={tone.text}>
                {module.symbol.text}
              </AppText>
            )}
          </View>
          <AppText variant="bodyStrong" style={styles.title}>
            {module.title}
          </AppText>
          <AppText variant="bodyStrong" tone="marca">
            {`${percent}%`}
          </AppText>
        </View>
        <ProgressTrack percent={percent} tone="official" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    width: sizes.moduleBadge,
    height: sizes.moduleBadge,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
});
