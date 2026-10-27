import { useCallback } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  RoundGameScreen,
  supportMessages,
} from '@/features/games/components/RoundGameScreen';
import { MemoryCard } from '@/features/memory/components/MemoryCard';
import {
  MEMORY_INSTRUCTION,
  useMemoryGame,
} from '@/features/memory/useMemoryGame';
import { spacing } from '@/theme';

const MISMATCH = 'Son distintas. Toca otra carta';

/** Memoria: el niño voltea cartas hasta encontrar las parejas. */
export default function MemoryScreen() {
  const onFinish = useCallback(() => {
    router.replace('/student/memory/done');
  }, []);
  const { cards, index, total, solved, mismatch, isLast, flip, next } =
    useMemoryGame(onFinish);

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
