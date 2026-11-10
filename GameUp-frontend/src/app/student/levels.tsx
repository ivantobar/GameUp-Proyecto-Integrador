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
import { isLadderGame } from '@/data/types';
import { LevelUpCelebration } from '@/features/games/components/LevelUpCelebration';
import { gameHref, ladderHref } from '@/features/games/catalog';
import { useGameList, type GameListItem } from '@/features/games/useGameList';
import { useLevelCelebration } from '@/features/games/useLevelCelebration';
import { useRefreshOnFocus } from '@/data/useRefreshOnFocus';
import { spacing } from '@/theme';

const TITLE = 'Jugar por niveles';
const QUESTION = '¿A qué quieres jugar?';

/** Agrupa las tarjetas de dos en dos (cuadrícula del mockup). */
function pairs(items: GameListItem[]): GameListItem[][] {
  const rows: GameListItem[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
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
  const { resource, reload, refresh } = useGameList();
  // Al volver de un juego, las estrellas se actualizan.
  useRefreshOnFocus(refresh);
  const list = resource.status === 'ready' ? resource.data : null;
  const celebration = useLevelCelebration(
    list?.studentId ?? null,
    list?.levels ?? null,
  );

  return (
    <Screen
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
        <StateView
          kind="error"
          title="Vamos a intentarlo otra vez"
          action={{ label: 'Intentar de nuevo', onPress: reload }}
        />
      ) : null}

      <LevelUpCelebration
        levelUp={celebration.levelUp}
        onClose={celebration.close}
      />

      {resource.status === 'ready'
        ? resource.data.sections.map((section) => (
            <View key={section.id} style={styles.section}>
              <AppText
                variant="label"
                tone="secundario"
                accessibilityRole="header"
              >
                {section.title}
              </AppText>
              {pairs(section.items).map((row) => (
                <View
                  key={row.map((item) => item.game.id).join('-')}
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
                  {row.length === 1 ? <View style={styles.spacer} /> : null}
                </View>
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
