import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  HeaderBackButton,
  Screen,
  ScreenHeader,
  StateView,
} from '@/components/ui';
import { Character, NarrationButton } from '@/components/gameup';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import { useRefreshOnFocus } from '@/data/useRefreshOnFocus';
import { assignmentHref, findGame } from '@/features/games/catalog';
import { TaskCard } from '@/features/games/components/TaskCard';
import {
  groupByModule,
  taskBadge,
  taskTitle,
  type ModuleTasks,
} from '@/features/games/moduleTasks';
import { spacing } from '@/theme';

const DONE_TITLE = '¡Terminaste este tema!';

/**
 * Tareas de la profe de un módulo (tema). Cada tarjeta abre esa actividad;
 * su resultado va a la profe y cuenta para el módulo, no para los niveles.
 */
export default function ModuleTasksScreen() {
  const params = useLocalSearchParams<{ moduleId: string }>();
  const moduleId = String(params.moduleId ?? '');
  const { students, assignments } = useRepositories();

  const load = useCallback(async (): Promise<ModuleTasks | null> => {
    const student = await students.getCurrentStudent();
    const pending = await assignments.listPendingForStudent(student.id);
    return groupByModule(pending).find((g) => g.moduleId === moduleId) ?? null;
  }, [students, assignments, moduleId]);

  const { resource, reload, refresh } = useResource(load);
  // Al volver de una actividad, la lista se actualiza.
  useRefreshOnFocus(refresh);

  const group = resource.status === 'ready' ? resource.data : null;
  const title = group?.title ?? 'Tareas de tu profe';
  const narration = group
    ? `${group.title}. Toca una actividad para jugarla.`
    : DONE_TITLE;

  return (
    <Screen
      header={
        <ScreenHeader
          left={<HeaderBackButton onPress={() => router.back()} />}
          title={title}
          right={<NarrationButton text={narration} />}
        />
      }
    >
      {resource.status === 'loading' ? (
        <StateView kind="loading" title="Buscando tus actividades…" />
      ) : null}
      {resource.status === 'error' ? (
        <StateView
          kind="error"
          title="Vamos a intentarlo otra vez"
          action={{ label: 'Intentar de nuevo', onPress: reload }}
        />
      ) : null}

      {resource.status === 'ready' && !group ? (
        <View style={styles.center}>
          <Character mouth="smile" size="lg" />
          <AppText variant="title" style={styles.text}>
            {DONE_TITLE}
          </AppText>
          <AppText tone="secundario" style={styles.text}>
            Tu profe va a revisar lo que hiciste.
          </AppText>
          <Button
            label="Volver a los juegos"
            size="large"
            onPress={() => router.back()}
          />
        </View>
      ) : null}

      {group ? (
        <View style={styles.list}>
          <AppText variant="display" accessibilityRole="header">
            {group.title}
          </AppText>
          {group.tasks.map((task) => {
            const game = findGame(task.gameId);
            return (
              <TaskCard
                key={task.id}
                caption={game.title}
                title={taskTitle(task)}
                icon={game.icon}
                badge={taskBadge(task)}
                accessibilityHint="Abre esta actividad de tu profe."
                onPress={() => router.push(assignmentHref(task))}
              />
            );
          })}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  center: {
    alignItems: 'center',
    gap: spacing.md,
  },
  text: {
    textAlign: 'center',
  },
});
