import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  HeaderBackButton,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import { GameCard, NarrationButton } from '@/components/gameup';
import { useRefreshOnFocus } from '@/data/useRefreshOnFocus';
import { moduleBadge, type ModuleTasks } from '@/features/games/moduleTasks';
import { useModuleTasks } from '@/features/games/useModuleTasks';
import { spacing } from '@/theme';

const QUESTION = '¿Qué quieres hacer?';
const TASKS = 'Tareas de mi profe';
const LEVELS = 'Jugar por niveles';

/** «2 temas» / «1 tema» / «Hoy no hay»; mientras carga, nada. */
function tasksSubtitle(modules: ModuleTasks[] | null): string {
  if (!modules) return 'Lo que te dejó tu profe';
  if (modules.length === 0) return 'Hoy no hay';
  return modules.length === 1 ? '1 tema' : `${modules.length} temas`;
}

/** «Nuevo» si algún tema trae algo sin abrir; si no, «Otra vez». */
function tasksBadge(modules: ModuleTasks[] | null): string | undefined {
  const badges = (modules ?? []).map(moduleBadge);
  if (badges.includes('Nuevo')) return 'Nuevo';
  if (badges.includes('Otra vez')) return 'Otra vez';
  return undefined;
}

/**
 * Pantalla 2 · Juegos. El niño elige entre las tareas de su profe (por
 * módulo) y los juegos por niveles; las dos cosas no se mezclan.
 */
export default function GamesScreen() {
  const { resource, refresh } = useModuleTasks();
  // Al volver, la cuenta de temas y la insignia se actualizan.
  useRefreshOnFocus(refresh);
  const modules = resource.status === 'ready' ? resource.data : null;

  return (
    <Screen
      safeAreaBottom={false}
      header={
        <ScreenHeader
          left={
            <HeaderBackButton onPress={() => router.navigate('/student')} />
          }
          title="Juegos"
          right={
            <NarrationButton text={`${QUESTION} ${TASKS}, o ${LEVELS}.`} />
          }
        />
      }
    >
      <AppText variant="display" accessibilityRole="header">
        {QUESTION}
      </AppText>
      <View style={styles.choices}>
        <GameCard
          tone="brand"
          icon="book"
          title={TASKS}
          subtitle={tasksSubtitle(modules)}
          badge={tasksBadge(modules)}
          accessibilityHint="Abre los temas que te dejó tu profe."
          onPress={() => router.push('/student/tasks')}
        />
        <GameCard
          tone="warm"
          icon="starOutline"
          title={LEVELS}
          subtitle="Juega y gana estrellas"
          accessibilityHint="Abre los juegos que suben de nivel."
          onPress={() => router.push('/student/levels')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // En fila, como las tarjetas de Inicio (GameCard ocupa el ancho con flex).
  choices: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
