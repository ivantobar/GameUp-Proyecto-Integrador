import { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import type { MemoryBoard } from '@/data/types';
import { GameContentGate } from '@/features/games/components/GameContentGate';
import { parseActivityId } from '@/features/games/delivery';
import { useActivityContent } from '@/features/games/useActivityContent';
import { useGameFinish } from '@/features/games/useGameFinish';
import { StyleSheet, View } from 'react-native';
import {
  RoundGameScreen,
  supportMessages,
} from '@/features/games/components/RoundGameScreen';
import { MemoryCard } from '@/features/memory/components/MemoryCard';
import { memoryScore, type MemoryState } from '@/features/memory/memoryGame';
import {
  MEMORY_INSTRUCTION,
  useMemoryGame,
} from '@/features/memory/useMemoryGame';
import { spacing } from '@/theme';

const MISMATCH = 'Son distintas. Toca otra carta';

/**
 * Memoria: el niño voltea cartas hasta encontrar las parejas. Con
 * `actividadId`, juega los tableros de esa tarea y su resultado va al docente.
 */
export default function MemoryScreen() {
  const params = useLocalSearchParams<{ actividadId?: string }>();
  const activityId = parseActivityId(params.actividadId);
  const { resource, reload } = useActivityContent(activityId, 'memory');
  return (
    <GameContentGate resource={resource} reload={reload}>
      {(activity) => (
        <MemoryGame boards={activity?.boards} activityId={activityId} />
      )}
    </GameContentGate>
  );
}

interface MemoryGameProps {
  /** Tableros de la tarea; sin ellos, el contenido de ejemplo. */
  boards: readonly MemoryBoard[] | undefined;
  activityId: string | null;
}

function MemoryGame({ boards, activityId }: MemoryGameProps) {
  const { saving, finish } = useGameFinish('memory', activityId);
  const onFinish = useCallback(
    (state: MemoryState) => {
      finish(memoryScore(state)).catch(() => {});
    },
    [finish],
  );
  const { cards, index, total, solved, mismatch, isLast, flip, next } =
    useMemoryGame(onFinish, boards);

  const message = solved ? supportMessages.solved : mismatch ? MISMATCH : null;

  // Cuadrícula de 2 columnas.
  const rows: (typeof cards)[] = [];
  for (let i = 0; i < cards.length; i += 2) rows.push(cards.slice(i, i + 2));

  return (
    <RoundGameScreen
      question={MEMORY_INSTRUCTION}
      narration={`${MEMORY_INSTRUCTION}. Toca una carta para verla.`}
      index={index}
      total={total}
      solved={solved}
      isLast={isLast}
      onNext={next}
      saving={saving}
      pendingHint="Primero encuentra todas las parejas"
      message={message}
    >
      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={row.map((card) => card.key).join('-')} style={styles.row}>
            {row.map((card, column) => {
              const position = rowIndex * 2 + column;
              return (
                <MemoryCard
                  key={card.key}
                  position={position + 1}
                  face={card.face}
                  view={card.view}
                  onPress={() => flip(position)}
                />
              );
            })}
          </View>
        ))}
      </View>
    </RoundGameScreen>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
