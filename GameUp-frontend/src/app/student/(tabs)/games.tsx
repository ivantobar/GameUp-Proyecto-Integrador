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
import { gameHref } from '@/features/games/catalog';
import { useGameList, type GameListItem } from '@/features/games/useGameList';
import { spacing } from '@/theme';

const QUESTION = '¿A qué quieres jugar?';

/** Agrupa las tarjetas de dos en dos (cuadrícula del mockup). */
function pairs(items: GameListItem[]): GameListItem[][] {
  const rows: GameListItem[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
}

/** Pantalla 2 · Juegos. Las secciones y tarjetas salen del catálogo. */
export default function GamesScreen() {
  const { resource, reload } = useGameList();

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

      {resource.status === 'ready'
        ? resource.data.map((section) => (
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
                  {row.map(({ game, badge }) => (
                    <GameCard
                      key={game.id}
                      title={game.title}
                      subtitle={game.subtitle}
                      icon={game.icon}
                      tone={game.tone}
                      badge={badge}
                      onPress={() => router.push(gameHref(game))}
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
