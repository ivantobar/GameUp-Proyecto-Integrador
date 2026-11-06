import { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Card } from '@/components/ui';
import {
  Pictogram,
  PictureCard,
  type PictureCardState,
} from '@/components/gameup';
import type { MatchRound } from '@/data/types';
import { GameContentGate } from '@/features/games/components/GameContentGate';
import {
  phaseMessage,
  RoundGameScreen,
} from '@/features/games/components/RoundGameScreen';
import {
  turnScore,
  type TurnGameState,
  type TurnPhase,
} from '@/features/games/turnGame';
import {
  useGameContent,
  type GameRouteParams,
} from '@/features/games/useGameContent';
import { useGameFinish } from '@/features/games/useGameFinish';
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

/**
 * Emparejar: una tarjeta arriba; el niño toca la que va con ella. Con
 * `actividadId`, juega las rondas de esa tarea y su resultado va al docente.
 */
export default function MatchScreen() {
  const params = useLocalSearchParams<GameRouteParams>();
  const { resource, reload } = useGameContent(params, 'match');
  return (
    <GameContentGate resource={resource} reload={reload}>
      {(source) => (
        <MatchGame
          rounds={source.content?.rounds}
          activityId={source.activityId}
          ladder={source.ladder}
        />
      )}
    </GameContentGate>
  );
}

interface MatchGameProps {
  /** Rondas de la tarea; sin ellas, el contenido de ejemplo. */
  rounds: readonly MatchRound[] | undefined;
  activityId: string | null;
  /** Abierto en su nivel de la escalera (para «Jugar otra vez»). */
  ladder: boolean;
}

function MatchGame({ rounds, activityId, ladder }: MatchGameProps) {
  const { saving, finish } = useGameFinish('match', activityId, ladder);
  const onFinish = useCallback(
    (state: TurnGameState) => {
      finish(turnScore(state)).catch(() => {});
    },
    [finish],
  );
  const { round, index, total, phase, isLast, choose, next } = useMatchGame(
    onFinish,
    rounds,
  );

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
      saving={saving}
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
