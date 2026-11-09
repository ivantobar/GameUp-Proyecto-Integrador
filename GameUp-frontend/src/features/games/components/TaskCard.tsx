import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Badge,
  Icon,
  PressableCard,
  type IconName,
} from '@/components/ui';
import { colors, radii, sizes, spacing } from '@/theme';

interface TaskCardProps {
  /** Texto pequeño de arriba («Tarea de tu profe», «Emparejar»). */
  caption: string;
  title: string;
  icon: IconName;
  badge?: string;
  onPress: () => void;
  accessibilityHint?: string;
}

/**
 * Tarjeta ancha de una tarea de la profe (un módulo o una de sus
 * actividades). Mismo estilo que el aviso «Tu profe te dejó…» de Inicio.
 */
export function TaskCard({
  caption,
  title,
  icon,
  badge,
  onPress,
  accessibilityHint,
}: TaskCardProps) {
  return (
    <PressableCard
      onPress={onPress}
      accessibilityLabel={[caption, title, badge].filter(Boolean).join('. ')}
      accessibilityHint={accessibilityHint}
    >
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <Icon name={icon} size="lg" color={colors.verde.oscuro} />
        </View>
        <View style={styles.texts}>
          <AppText variant="support" tone="secundario">
            {caption}
          </AppText>
          <AppText variant="subtitle">{title}</AppText>
        </View>
        {badge ? <Badge label={badge} /> : null}
      </View>
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBox: {
    width: sizes.iconBox,
    height: sizes.iconBox,
    borderRadius: radii.lg,
    backgroundColor: colors.verde.suave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
  },
});
