import { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { PictureCard, type PictureCardState } from '@/components/gameup';
import {
  phaseMessage,
  RoundGameScreen,
} from '@/features/games/components/RoundGameScreen';
import { GameContentGate } from '@/features/games/components/GameContentGate';
import { parseActivityId } from '@/features/games/delivery';
import { useActivityContent } from '@/features/games/useActivityContent';
import { useGameFinish } from '@/features/games/useGameFinish';
import { turnScore, type TurnGameState } from '@/features/games/turnGame';
import { SequenceSlots } from '@/features/sequence/components/SequenceSlots';
import {
  sequenceQuestion,
  useSequenceGame,
} from '@/features/sequence/useSequenceGame';
import type { PictureFace, SequenceRoutine } from '@/data/types';
import { spacing } from '@/theme';

/** Agrupa las opciones de dos en dos (cuadrícula 2 × 2). */
function pairs(items: readonly PictureFace[]): PictureFace[][] {
  const rows: PictureFace[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
}

/**
 * Secuenciar: el niño toca, en orden, los pasos de una rutina. Con
 * `actividadId`, juega las rutinas de esa tarea y su resultado va al docente.
 */
export default function SequenceScreen() {
  const params = useLocalSearchParams<{ actividadId?: string }>();
  const activityId = parseActivityId(params.actividadId);
  const { resource, reload } = useActivityContent(activityId, 'sequence');
  return (
    <GameContentGate resource={resource} reload={reload}>
      {(activity) => (
        <SequenceGame routines={activity?.routines} activityId={activityId} />
      )}
    </GameContentGate>
  );
}

interface SequenceGameProps {
  /** Rutinas de la tarea; sin ellas, el contenido de ejemplo. */
  routines: readonly SequenceRoutine[] | undefined;
  activityId: string | null;
}

function SequenceGame({ routines, activityId }: SequenceGameProps) {
  const { saving, finish } = useGameFinish('sequence', activityId);
  const onFinish = useCallback(
    (state: TurnGameState) => {
      finish(turnScore(state)).catch(() => {});
    },
    [finish],
  );
  const {
    routine,
    placed,
    expected,
    options,
    index,
    total,
    phase,
    isLast,
    choose,
    next,
  } = useSequenceGame(onFinish, routines);

  if (!routine) return null;

  const solved = phase === 'solved';
  const question = solved
    ? '¡Todos los pasos en orden!'
    : sequenceQuestion(placed.length, routine.steps.length);
  const state = (stepId: string): PictureCardState =>
    phase === 'hinted' && stepId === expected?.id ? 'hint' : 'idle';

  return (
    <RoundGameScreen
      question={question}
      narration={`${routine.title}. ${question} Toca el paso que sigue.`}
      index={index}
      total={total}
      solved={solved}
      isLast={isLast}
      onNext={next}
      saving={saving}
      pendingHint="Primero ordena todos los pasos"
      message={phaseMessage(phase)}
    >
      <View style={styles.routine}>
        <AppText variant="label" tone="secundario" style={styles.center}>
          {routine.title}
        </AppText>
        <SequenceSlots total={routine.steps.length} placed={placed} />
      </View>

      <View style={styles.grid}>
        {pairs(options).map((row) => (
          <View key={row.map((step) => step.id).join('-')} style={styles.row}>
            {row.map((step) => (
              <PictureCard
                key={step.id}
                face={step}
                layout="tile"
                showLabel
                state={state(step.id)}
                onPress={() => choose(step.id)}
              />
            ))}
            {/* Si la fila queda impar, un hueco mantiene el ancho. */}
            {row.length === 1 ? <View style={styles.spacer} /> : null}
          </View>
        ))}
      </View>
    </RoundGameScreen>
  );
}

const styles = StyleSheet.create({
  routine: {
    gap: spacing.sm,
  },
  center: {
    textAlign: 'center',
  },
  grid: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  spacer: {
    flex: 1,
  },
});
