import { StyleSheet, View } from 'react-native';
import { AppText, Badge, Card, Icon } from '@/components/ui';
import type { ActivityFeedback } from '@/data/types';
import { findGame } from '@/features/games/catalog';
import { colors, spacing } from '@/theme';

interface ActivityFeedbackCardProps {
  feedback: readonly ActivityFeedback[];
}

/**
 * «Lo que dijo la profe»: la retroalimentación de las actividades que
 * revisó (decisión D5). El estado va con texto, no solo con color.
 */
export function ActivityFeedbackCard({ feedback }: ActivityFeedbackCardProps) {
  return (
    <Card>
      <View style={styles.body}>
        <View style={styles.title}>
          <Icon name="note" color={colors.verde.oscuro} />
          <AppText variant="bodyStrong" tone="marca" accessibilityRole="header">
            Lo que dijo la profe en las actividades
          </AppText>
        </View>
        {feedback.map((item) => (
          <View
            key={item.activityId}
            style={styles.item}
            accessible
            accessibilityLabel={`${findGame(item.gameId).title}, ${item.title}. ${
              item.status === 'validated' ? 'Lo logró' : 'Practicar más'
            }. ${item.text}`}
          >
            <View style={styles.row}>
              <AppText variant="support" tone="secundario" style={styles.flex}>
                {findGame(item.gameId).title} · {item.title}
              </AppText>
              <Badge
                label={
                  item.status === 'validated' ? 'Lo logró' : 'Practicar más'
                }
              />
            </View>
            <AppText>{item.text}</AppText>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.sm,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  item: {
    gap: spacing.xxs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  flex: {
    flex: 1,
  },
});
