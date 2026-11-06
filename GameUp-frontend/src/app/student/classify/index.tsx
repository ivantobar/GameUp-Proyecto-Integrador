import { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { Pictogram } from '@/components/gameup';
import { CategoryBin } from '@/features/classify/components/CategoryBin';
import { useClassifyGame } from '@/features/classify/useClassifyGame';
import type { ClassifySet } from '@/data/types';
import { GameContentGate } from '@/features/games/components/GameContentGate';
import {
  useGameContent,
  type GameRouteParams,
} from '@/features/games/useGameContent';
import { useGameFinish } from '@/features/games/useGameFinish';
import { turnScore, type TurnGameState } from '@/features/games/turnGame';
import {
  RoundGameScreen,
  supportMessages,
} from '@/features/games/components/RoundGameScreen';
import { sizes, spacing } from '@/theme';

const HINT = '¡Casi! Prueba donde está la manito';

/**
 * Clasificar: un elemento a la vez; el niño toca su grupo. Con
 * `actividadId`, juega los conjuntos de esa tarea y su resultado va al docente.
 */
export default function ClassifyScreen() {
  const params = useLocalSearchParams<GameRouteParams>();
  const { resource, reload } = useGameContent(params, 'classify');
  return (
    <GameContentGate resource={resource} reload={reload}>
      {(source) => (
        <ClassifyGame
          sets={source.content?.sets}
          activityId={source.activityId}
          ladder={source.ladder}
        />
      )}
    </GameContentGate>
  );
}

interface ClassifyGameProps {
  /** Conjuntos de la tarea; sin ellos, el contenido de ejemplo. */
  sets: readonly ClassifySet[] | undefined;
  activityId: string | null;
  /** Abierto en su nivel de la escalera (para «Jugar otra vez»). */
  ladder: boolean;
}

function ClassifyGame({ sets, activityId, ladder }: ClassifyGameProps) {
  const { saving, finish } = useGameFinish('classify', activityId, ladder);
  const onFinish = useCallback(
    (state: TurnGameState) => {
      finish(turnScore(state)).catch(() => {});
    },
    [finish],
  );
  const { set, item, placed, index, total, phase, isLast, choose, next } =
    useClassifyGame(onFinish, sets);

  if (!set) return null;

  const message =
    phase === 'hinted'
      ? HINT
      : phase === 'solved'
        ? supportMessages.solved
        : null;

  return (
    <RoundGameScreen
      question={set.question}
      narration={`${set.question} Toca el grupo donde va${item ? ` ${item.label}` : ''}.`}
      index={index}
      total={total}
      solved={phase === 'solved'}
      isLast={isLast}
      onNext={next}
      saving={saving}
      pendingHint="Primero pon cada uno en su grupo"
      message={message}
    >
      <Card style={styles.item}>
        {item ? (
          <View accessible accessibilityLabel={`¿Dónde va ${item.label}?`}>
            <Pictogram face={item} size="lg" />
            <AppText variant="subtitle" style={styles.center}>
              {item.label}
            </AppText>
          </View>
        ) : (
          <AppText variant="subtitle" tone="marca" style={styles.center}>
            ¡Todos en su grupo!
          </AppText>
        )}
      </Card>

      <View style={styles.bins}>
        {set.categories.map((category) => (
          <CategoryBin
            key={category.id}
            category={category}
            items={placed.filter((p) => p.categoryId === category.id)}
            hint={phase === 'hinted' && item?.categoryId === category.id}
            disabled={!item}
            compact={set.categories.length > 2}
            onPress={() => choose(category.id)}
          />
        ))}
      </View>
    </RoundGameScreen>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: sizes.pictureStage,
  },
  center: {
    textAlign: 'center',
  },
  bins: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
