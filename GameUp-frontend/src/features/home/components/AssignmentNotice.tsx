import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Badge,
  Icon,
  PressableCard,
  type IconName,
} from '@/components/ui';
import { colors, radii, sizes, spacing } from '@/theme';

interface AssignmentNoticeProps {
  gameTitle: string;
  icon: IconName;
  onPress: () => void;
}

/** «Tu profe te dejó…»: la tarea nueva aparece aparte (mockup 1). */
export function AssignmentNotice({
  gameTitle,
  icon,
  onPress,
}: AssignmentNoticeProps) {
  return (
    <PressableCard
      onPress={onPress}
      accessibilityLabel={`Tarea nueva. Tu profe te dejó ${gameTitle}`}
    >
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <Icon name={icon} size="lg" color={colors.verde.oscuro} />
        </View>
        <View style={styles.texts}>
          <AppText variant="support" tone="secundario">
            Tu profe te dejó
          </AppText>
          <AppText variant="subtitle">{gameTitle}</AppText>
        </View>
        <Badge label="Nueva" />
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
