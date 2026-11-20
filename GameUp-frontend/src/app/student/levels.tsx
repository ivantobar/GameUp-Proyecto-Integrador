import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  HeaderBackButton,
  Screen,
  ScreenHeader,
  StateView,
} from '@/components/ui';
import { GameCard, NarrationButton } from '@/components/gameup';
import { EnterStagger } from '@/components/gameup/motion';
import { isLadderGame } from '@/data/types';
import { LevelUpCelebration } from '@/features/games/components/LevelUpCelebration';
import { gameHref, ladderHref } from '@/features/games/catalog';
import { useGameList, type GameListItem } from '@/features/games/useGameList';
import { useLevelCelebration } from '@/features/games/useLevelCelebration';
import { useScreenRefresh } from '@/features/refresh/useScreenRefresh';
import { useLargeText } from '@/features/accessibility/useLargeText';
import { spacing } from '@/theme';
import { errorOf, LoadErrorState } from '@/features/errors/LoadErrorState';

const TITLE = 'Jugar por niveles';
const QUESTION = '¿A qué quieres jugar?';

/**
 * Agrupa las tarjetas de dos en dos (cuadrícula del mockup) o, con letra
 * grande, de a una (si no, los nombres largos se parten a la mitad).
 */
function rowsOf(items: GameListItem[], perRow: 1 | 2): GameListItem[][] {
  const rows: GameListItem[][] = [];
  for (let i = 0; i < items.length; i += perRow)
    rows.push(items.slice(i, i + perRow));
  return rows;
}

/**
 * A dónde lleva la tarjeta de un juego: el nivel actual de su escalera (los
 * de pensar) o el juego libre (los de sonidos, o si los niveles no cargan).
 * Nunca abre una tarea: las tareas están en «Tareas de tu profe».
 */
function cardHref({ game, level }: GameListItem) {
  if (level && isLadderGame(game.id)) return ladderHref(game.id);
  return gameHref(game);
}

/**
 * Jugar por niveles: los juegos de pensar abren su nivel de la escalera y
 * los de sonidos, el juego libre. Las tareas de la profe no salen aquí.
 */
export default function LevelsScreen() {
  const { resource, reload, refresh, refreshing, refreshFailed } =
    useGameList();
  const perRow = useLargeText() ? 1 : 2;
  // Al volver de un juego, las estrellas se actualizan.
  const screenRefresh = useScreenRefresh({
    refresh,
    refreshing,
    refreshFailed,
  });
  const list = resource.status === 'ready' ? resource.data : null;
  const celebration = useLevelCelebration(
    list?.studentId ?? null,
    list?.levels ?? null,
  );

  return (
    <Screen
      refresh={screenRefresh}
      backdrop="clouds"
      header={
        <ScreenHeader
          left={<HeaderBackButton onPress={() => router.back()} />}
          title={TITLE}
          right={<NarrationButton text={`${QUESTION} Toca un juego.`} />}
        />
      }
    >
      <AppText variant="display" accessibilityRole="header">
        {QUESTION}
      </AppText>

      {resource.status === 'loading' ? (
        <StateView kind="loading" title="Buscando tus juegos…" />
      ) : null}
      {resource.status === 'error' ? (
        <LoadErrorState
          error={errorOf(resource)}
          title="Vamos a intentarlo otra vez"
          action={{ label: 'Intentar de nuevo', onPress: reload }}
        />
      ) : null}

      <LevelUpCelebration
        levelUp={celebration.levelUp}
        onClose={celebration.close}
      />

      {resource.status === 'ready'
        ? resource.data.sections.map((section, sectionIndex) => (
            <View key={section.id} style={styles.section}>
              <AppText
                variant="label"
                tone="secundario"
                accessibilityRole="header"
              >
                {section.title}
              </AppText>
              {rowsOf(section.items, perRow).map((row, rowIndex) => (
                // Cada fila entra un poco después de la anterior.
                <EnterStagger
                  key={row.map((item) => item.game.id).join('-')}
                  index={sectionIndex * 3 + rowIndex}
                  style={styles.row}
                >
                  {row.map((item) => (
                    <GameCard
                      key={item.game.id}
                      title={item.game.title}
                      subtitle={item.game.subtitle}
                      icon={item.game.icon}
                      game={item.game.id}
                      tone={item.game.tone}
                      badge={item.badge}
                      level={item.level?.level}
                      // Su nivel actual (llega a la profe) o el juego libre.
                      onPress={() => router.push(cardHref(item))}
                    />
                  ))}
                  {/* Si la fila queda impar, un hueco mantiene el ancho. */}
                  {row.length < perRow ? <View style={styles.spacer} /> : null}
                </EnterStagger>
              ))}
            </View>
          ))
        : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
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
