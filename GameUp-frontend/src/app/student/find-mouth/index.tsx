import { useCallback } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  HeaderBackButton,
  IconButton,
  Notice,
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
import type { ListeningResult, Vowel } from '@/data/types';
import type { RoundPhase } from '@/features/find-mouth/mouthQuiz';
import { useMouthQuiz } from '@/features/find-mouth/useMouthQuiz';
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
  // El resultado ya quedó guardado para el docente; al niño no se le
  // muestra un puntaje, solo la celebración.
  const onFinish = useCallback((_result: ListeningResult) => {
    router.replace('/student/find-mouth/done');
  }, []);

  const {
    round,
    index,
    total,
    phase,
    finished,
    submitPhase,
    playSound,
    choose,
    next,
    retrySubmit,
  } = useMouthQuiz(onFinish);

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
        submitPhase === 'error' ? (
          <Notice
            icon="replay"
            tone="warm"
            message="Vamos a intentarlo otra vez."
            action={
              <Button
                label="Intentar de nuevo"
                variant="secondary"
                onPress={() => {
                  retrySubmit().catch(() => {});
                }}
              />
            }
          />
        ) : (
          <StateView kind="loading" title="¡Muy bien! Guardando…" />
        )
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
