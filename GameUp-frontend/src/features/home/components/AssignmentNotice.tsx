import { StyleSheet, View } from 'react-native';
import { AppText, Badge, PressableCard } from '@/components/ui';
import { GameIcon } from '@/components/gameup';
import type { GameId } from '@/data/types';
import { spacing } from '@/theme';

interface AssignmentNoticeProps {
  gameTitle: string;
  /** Juego de la tarea: se ve su dibujo a color. */
  game: GameId;
  /** La profe pidió practicarla otra vez (no es nueva). */
  again?: boolean;
  onPress: () => void;
}

/** «Tu profe te dejó…»: la tarea nueva aparece aparte (mockup 1). */
export function AssignmentNotice({
  gameTitle,
  game,
  again = false,
  onPress,
}: AssignmentNoticeProps) {
  const badge = again ? 'Otra vez' : 'Nueva';
  return (
    <PressableCard
      onPress={onPress}
      accessibilityLabel={
        again
          ? `Tarea para practicar otra vez. Tu profe te dejó ${gameTitle}`
          : `Tarea nueva. Tu profe te dejó ${gameTitle}`
      }
    >
      <View style={styles.row}>
        <GameIcon game={game} size="sm" />
        <View style={styles.texts}>
          <AppText variant="support" tone="secundario">
            Tu profe te dejó
          </AppText>
          <AppText variant="subtitle">{gameTitle}</AppText>
        </View>
        <Badge label={badge} />
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
  texts: {
    flex: 1,
  },
});
