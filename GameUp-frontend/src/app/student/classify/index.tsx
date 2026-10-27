import { useCallback } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { Pictogram } from '@/components/gameup';
import { CategoryBin } from '@/features/classify/components/CategoryBin';
import { useClassifyGame } from '@/features/classify/useClassifyGame';
import {
  RoundGameScreen,
  supportMessages,
} from '@/features/games/components/RoundGameScreen';
import { sizes, spacing } from '@/theme';

const HINT = '¡Casi! Prueba donde está la manito';

/** Clasificar: un elemento a la vez; el niño toca su grupo. */
export default function ClassifyScreen() {
  const onFinish = useCallback(() => {
    router.replace('/student/classify/done');
  }, []);
  const { set, item, placed, index, total, phase, isLast, choose, next } =
    useClassifyGame(onFinish);

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
