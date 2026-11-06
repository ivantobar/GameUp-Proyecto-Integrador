import { useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  HeaderBackButton,
  IconButton,
  ProgressDots,
  Screen,
  ScreenHeader,
  StateView,
} from '@/components/ui';
import {
  MouthOption,
  NarrationButton,
  type MouthOptionState,
} from '@/components/gameup';
import type { Vowel } from '@/data/types';
import type { RoundPhase } from '@/features/find-mouth/mouthQuiz';
import { useFindMouthVowels } from '@/features/find-mouth/useFindMouthVowels';
import { useMouthQuiz } from '@/features/find-mouth/useMouthQuiz';
import { parseActivityId, type Delivery } from '@/features/games/delivery';
import { colors, radii, spacing } from '@/theme';

const QUESTION = '¿Qué boca hace este sonido?';

/** Estado visual de cada boca según la fase de la ronda. */
function optionState(
  vowel: Vowel,
  target: Vowel,
  phase: RoundPhase,
): MouthOptionState {
  if (vowel !== target) return phase === 'solved' ? 'dimmed' : 'idle';
  if (phase === 'solved') return 'correct';
  if (phase === 'hinted') return 'hint';
  return 'idle';
}

/** Pantalla 7 · Busca la boca. */
export default function FindMouthScreen() {
  // Con `actividadId`, el juego viene de una tarea: juega sus vocales y el
  // resultado va al docente. Sin él, es libre (las cinco vocales).
  const params = useLocalSearchParams<{ actividadId?: string }>();
  const activityId = parseActivityId(params.actividadId);
  const { resource, reload } = useFindMouthVowels(activityId);

  if (resource.status !== 'ready') {
    return (
      <Screen
        tone="softOrange"
        header={
          <ScreenHeader
            left={<HeaderBackButton onPress={() => router.back()} />}
          />
        }
      >
        {resource.status === 'loading' ? (
          <StateView kind="loading" title="Preparando el juego…" />
        ) : (
          <StateView
            kind="error"
            title="Vamos a intentarlo otra vez"
            action={{ label: 'Intentar de nuevo', onPress: reload }}
          />
        )}
      </Screen>
    );
  }

  return <FindMouthGame vowels={resource.data} activityId={activityId} />;
}

interface FindMouthGameProps {
  vowels: readonly Vowel[];
  activityId: string | null;
}

function FindMouthGame({ vowels, activityId }: FindMouthGameProps) {
  // Al niño no se le muestra un puntaje, solo la celebración. La pantalla
  // final sabe si el resultado llegó al docente (`envio`).
  const onFinish = useCallback(
    (delivery: Delivery) => {
      router.replace({
        pathname: '/student/find-mouth/done',
        params: {
          envio: delivery,
          vocales: String(vowels.length),
          ...(activityId ? { actividadId: activityId } : {}),
        },
      });
    },
    [activityId, vowels.length],
  );

  const { round, index, total, phase, finished, playSound, choose, next } =
    useMouthQuiz({ vowels, activityId, onFinish });

  const isLast = index === total - 1;

  return (
    <Screen
      tone="softOrange"
      header={
        <ScreenHeader
          left={<HeaderBackButton onPress={() => router.back()} />}
          center={<ProgressDots total={total} current={index} />}
          right={
            <NarrationButton
              text={`${QUESTION} Toca el parlante para oírlo y toca la boca.`}
            />
          }
        />
      }
      footer={
        finished ? undefined : (
          <Button
            label={isLast ? 'Terminar' : 'Siguiente'}
            size="large"
            disabled={phase !== 'solved'}
            accessibilityHint={
              phase === 'solved' ? undefined : 'Primero toca la boca del sonido'
            }
            onPress={next}
          />
        )
      }
    >
      <AppText variant="title" accessibilityRole="header" style={styles.center}>
        {QUESTION}
      </AppText>

      <View style={styles.listen}>
        <View style={styles.halo}>
          <IconButton
            icon="speaker"
            variant="solid"
            size="lg"
            accessibilityLabel="Oír el sonido otra vez"
            onPress={playSound}
          />
        </View>
        <AppText variant="bodyStrong" tone="cafe">
          Toca para oír otra vez
        </AppText>
      </View>

      {finished ? (
        <StateView kind="loading" title="¡Muy bien! Guardando…" />
      ) : round ? (
        <View style={styles.options} accessibilityLiveRegion="polite">
          {round.options.map((vowel) => (
            <MouthOption
              key={vowel}
              vowel={vowel}
              state={optionState(vowel, round.target, phase)}
              onPress={() => choose(vowel)}
            />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  listen: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  halo: {
    padding: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.superficie.blanca,
  },
  options: {
    gap: spacing.md,
  },
});
