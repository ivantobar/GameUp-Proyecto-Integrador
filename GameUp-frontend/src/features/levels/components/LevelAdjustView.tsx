import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { LevelStars } from '@/components/gameup';
import {
  AppText,
  Badge,
  Button,
  HeaderBackButton,
  Notice,
  PressableCard,
  Screen,
  ScreenHeader,
  StateView,
  TextField,
} from '@/components/ui';
import type { GameLevel, LadderGameId } from '@/data/types';
import { leaveLevelNotice } from '@/features/students/assignmentNotice';
import { isAccessError } from '@/features/students/assignmentText';
import { spacing } from '@/theme';
import {
  MAX_REASON_LENGTH,
  allowedLevels,
  gameTitle,
  levelChangedText,
} from '../levelChoices';
import { useLevelAdjust } from '../useLevelAdjust';
import { levelText } from './StudentLevels';

interface LevelAdjustViewProps {
  studentId: string;
  /** La directora sube o baja; la tallerista solo baja. */
  canRaise: boolean;
}

/**
 * «Cambiar nivel» de un juego con escalera: elegir el juego, el nivel y
 * escribir el motivo (queda en el historial). La tallerista solo ve niveles
 * menores al actual; la directora, cualquiera. Si el backend no deja, se
 * muestra su mensaje. Al guardar, vuelve al detalle con el aviso.
 */
export function LevelAdjustView({ studentId, canRaise }: LevelAdjustViewProps) {
  const { resource, reload, error, submitting, save } =
    useLevelAdjust(studentId);
  const [gameId, setGameId] = useState<LadderGameId | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const games = resource.status === 'ready' ? resource.data : [];
  const current = games.find((g) => g.gameId === gameId) ?? null;
  const choices = current ? allowedLevels(current, canRaise) : [];
  const chosenLevel = level !== null && choices.includes(level) ? level : null;
  const reasonText = reason.trim();
  const reasonTooLong = reasonText.length > MAX_REASON_LENGTH;
  const ready =
    current !== null &&
    chosenLevel !== null &&
    reasonText.length > 0 &&
    !reasonTooLong;

  const onSave = async () => {
    if (!current || chosenLevel === null || !ready) return;
    const ok = await save({
      studentId,
      gameId: current.gameId,
      level: chosenLevel,
      reason: reasonText,
    });
    if (ok) {
      leaveLevelNotice(
        studentId,
        levelChangedText(current.gameId, chosenLevel),
      );
      router.back();
    }
  };

  const saveLabel =
    current && chosenLevel !== null
      ? `Guardar: ${gameTitle(current.gameId)} en el nivel ${chosenLevel}`
      : 'Guardar nivel';

  return (
    <Screen
      header={
        <ScreenHeader
          left={<HeaderBackButton onPress={() => router.back()} />}
          title="Cambiar nivel"
        />
      }
      footer={
        resource.status === 'ready' && games.length > 0 ? (
          <Button
            label="Guardar nivel"
            icon="check"
            size="large"
            loading={submitting}
            disabled={!ready}
            accessibilityLabel={saveLabel}
            accessibilityHint={
              ready
                ? undefined
                : 'Primero elige el juego, el nivel y escribe el motivo'
            }
            onPress={() => {
              onSave().catch(() => {});
            }}
          />
        ) : undefined
      }
    >
      {resource.status === 'loading' ? (
        <StateView kind="loading" title="Buscando sus niveles…" />
      ) : null}
      {resource.status === 'error' ? (
        isAccessError(resource.error) ? (
          <StateView
            kind="error"
            title="No puedes cambiar sus niveles"
            message="Si debería estar a tu cargo, habla con la fundación."
          />
        ) : (
          <StateView
            kind="error"
            title="No pudimos cargar sus niveles"
            message="Revisa la conexión."
            action={{ label: 'Intentar de nuevo', onPress: reload }}
          />
        )
      ) : null}

      {resource.status === 'ready' ? (
        <>
          {canRaise ? null : (
            <Notice
              icon="info"
              tone="surface"
              message="Como tallerista, solo puedes bajar el nivel. Para subirlo, aprueba un intento del nivel actual."
            />
          )}

          <AppText variant="label" tone="secundario" accessibilityRole="header">
            1. Elige el juego
          </AppText>
          <View style={styles.list}>
            {games.map((game) => (
              <GameOption
                key={game.gameId}
                game={game}
                selected={game.gameId === gameId}
                onPress={() => {
                  setGameId(game.gameId);
                  setLevel(null);
                }}
              />
            ))}
          </View>

          {current ? (
            <>
              <AppText
                variant="label"
                tone="secundario"
                accessibilityRole="header"
              >
                2. Elige el nivel
              </AppText>
              {choices.length === 0 ? (
                <Notice
                  icon="info"
                  tone="warm"
                  message={`Ya está en el nivel ${current.level}: no se puede bajar más.`}
                />
              ) : (
                <View style={styles.levels}>
                  {choices.map((n) => (
                    <Button
                      key={n}
                      label={`Nivel ${n}`}
                      size="large"
                      variant={n === chosenLevel ? 'primary' : 'secondary'}
                      icon={n === chosenLevel ? 'check' : undefined}
                      accessibilityLabel={`Nivel ${n} de ${gameTitle(current.gameId)}${n === chosenLevel ? '. Elegido' : ''}`}
                      onPress={() => setLevel(n)}
                    />
                  ))}
                </View>
              )}
            </>
          ) : null}

          {current && choices.length > 0 ? (
            <TextField
              label="3. Escribe el motivo"
              value={reason}
              onChangeText={setReason}
              multiline
              placeholder="Por ejemplo: necesita repasar las parejas"
              helper={`Obligatorio. Queda en el historial (hasta ${MAX_REASON_LENGTH} caracteres).`}
              error={
                reasonTooLong
                  ? `El motivo admite hasta ${MAX_REASON_LENGTH} caracteres.`
                  : undefined
              }
              testID="motivo-nivel"
            />
          ) : null}

          {error ? (
            <View accessibilityLiveRegion="polite">
              <Notice icon="info" tone="warm" message={error} />
            </View>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

interface GameOptionProps {
  game: GameLevel;
  selected: boolean;
  onPress: () => void;
}

/** Un juego con su nivel actual, para elegir. */
function GameOption({ game, selected, onPress }: GameOptionProps) {
  const title = gameTitle(game.gameId);
  const text = levelText(game);
  return (
    <PressableCard
      tone={selected ? 'soft' : 'surface'}
      onPress={onPress}
      accessibilityLabel={[`${title}: ${text}`, selected ? 'Elegido' : null]
        .filter(Boolean)
        .join('. ')}
      testID={`juego-${game.gameId}`}
    >
      <View style={styles.option}>
        <AppText variant="bodyStrong" style={styles.flex}>
          {title}
        </AppText>
        <LevelStars level={game.level} />
        <AppText variant="support" tone="secundario">
          {text}
        </AppText>
        {selected ? <Badge label="Elegido" tone="brand" /> : null}
      </View>
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  levels: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
