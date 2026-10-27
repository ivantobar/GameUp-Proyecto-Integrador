import { useCallback } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Card } from '@/components/ui';
import {
  Pictogram,
  PictureCard,
  type PictureCardState,
} from '@/components/gameup';
import {
  phaseMessage,
  RoundGameScreen,
} from '@/features/games/components/RoundGameScreen';
import type { TurnPhase } from '@/features/games/turnGame';
import { useMatchGame } from '@/features/match/useMatchGame';
import { spacing } from '@/theme';

/** Estado visual de cada opción según la fase de la ronda. */
function optionState(
  optionId: string,
  answerId: string,
  phase: TurnPhase,
): PictureCardState {
  if (optionId !== answerId) return phase === 'solved' ? 'dimmed' : 'idle';
  if (phase === 'solved') return 'correct';
  if (phase === 'hinted') return 'hint';
  return 'idle';
}

/** Emparejar: una tarjeta arriba; el niño toca la que va con ella. */
export default function MatchScreen() {
  const onFinish = useCallback(() => {
    router.replace('/student/match/done');
  }, []);
  const { round, index, total, phase, isLast, choose, next } =
    useMatchGame(onFinish);

  if (!round) return null;

  return (
    <RoundGameScreen
      question={round.question}
      narration={`${round.question} ${round.prompt.label}. Toca la que va con ella.`}
      index={index}
      total={total}
      solved={phase === 'solved'}
      isLast={isLast}
      onNext={next}
      pendingHint="Primero toca la que va con la tarjeta"
      message={phaseMessage(phase)}
    >
      <Card style={styles.prompt}>
        <View accessible accessibilityLabel={`Tarjeta: ${round.prompt.label}`}>
          <Pictogram face={round.prompt} size="lg" />
        </View>
      </Card>

      <View style={styles.options}>
        {round.options.map((option) => (
          <PictureCard
            key={option.id}
            face={option}
            state={optionState(option.id, round.answerId, phase)}
            onPress={() => choose(option.id)}
          />
        ))}
      </View>
    </RoundGameScreen>
  );
}

const styles = StyleSheet.create({
  prompt: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  options: {
    gap: spacing.md,
  },
});
