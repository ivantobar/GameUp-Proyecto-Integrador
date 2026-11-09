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
import { TaskCard } from '@/features/games/components/TaskCard';
import { moduleBadge, tasksCountText } from '@/features/games/moduleTasks';
import { useGameList, type GameListItem } from '@/features/games/useGameList';
import { useLevelCelebration } from '@/features/games/useLevelCelebration';
import { useRefreshOnFocus } from '@/data/useRefreshOnFocus';
import { spacing } from '@/theme';

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

const TASKS_TITLE = 'Tareas de tu profe';

/** Pantalla 2 · Juegos. Las secciones y tarjetas salen del catálogo. */
export default function GamesScreen() {
  const { resource, reload, refresh } = useGameList();
  // Al volver de un juego, las tareas y las estrellas se actualizan.
  useRefreshOnFocus(refresh);
  const list = resource.status === 'ready' ? resource.data : null;
  const celebration = useLevelCelebration(
    list?.studentId ?? null,
    list?.levels ?? null,
  );

  return (
    <Screen
      safeAreaBottom={false}
      header={
        <ScreenHeader
          left={
            <HeaderBackButton onPress={() => router.navigate('/student')} />
          }
          title="Juegos"
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

      {resource.status === 'ready' && resource.data.modules.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="label" tone="secundario" accessibilityRole="header">
            {TASKS_TITLE}
          </AppText>
          {resource.data.modules.map((group) => (
            <TaskCard
              key={group.moduleId}
              caption={`${TASKS_TITLE} · ${tasksCountText(group.tasks.length)}`}
              title={group.title}
              icon="book"
              badge={moduleBadge(group)}
              accessibilityHint="Abre las actividades de este tema."
              onPress={() =>
                router.push({
                  pathname: '/student/module/[moduleId]',
                  params: { moduleId: group.moduleId },
                })
              }
            />
          ))}
        </View>
      ) : null}

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
