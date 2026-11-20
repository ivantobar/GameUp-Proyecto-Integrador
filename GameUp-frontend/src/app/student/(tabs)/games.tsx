import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  HeaderBackButton,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import { Character, GameCard, NarrationButton } from '@/components/gameup';
import { EnterStagger } from '@/components/gameup/motion';
import { useScreenRefresh } from '@/features/refresh/useScreenRefresh';
import { moduleBadge, type ModuleTasks } from '@/features/games/moduleTasks';
import { useModuleTasks } from '@/features/games/useModuleTasks';
import { useLargeText } from '@/features/accessibility/useLargeText';
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
  const { resource, refresh, refreshing, refreshFailed } = useModuleTasks();
  // Al volver, la cuenta de temas y la insignia se actualizan.
  const screenRefresh = useScreenRefresh({
    refresh,
    refreshing,
    refreshFailed,
  });
  const modules = resource.status === 'ready' ? resource.data : null;
  // Con letra grande, una opción debajo de la otra (no se parten palabras).
  const largeText = useLargeText();

  return (
    <Screen
      refresh={screenRefresh}
      backdrop="clouds"
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
      <View style={styles.question}>
        <Character mouth="smile" size="sm" />
        <AppText
          variant="display"
          accessibilityRole="header"
          style={styles.questionText}
        >
          {QUESTION}
        </AppText>
      </View>
      <EnterStagger
        index={0}
        style={largeText ? styles.choicesColumn : styles.choices}
      >
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
      </EnterStagger>
    </Screen>
  );
}

const styles = StyleSheet.create({
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  questionText: {
    flexShrink: 1,
  },
  // En fila, como las tarjetas de Inicio (GameCard ocupa el ancho con flex).
  choices: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  choicesColumn: {
    gap: spacing.md,
  },
});
