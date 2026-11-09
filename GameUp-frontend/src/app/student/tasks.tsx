import { router } from 'expo-router';
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
import { useRefreshOnFocus } from '@/data/useRefreshOnFocus';
import { TaskCard } from '@/features/games/components/TaskCard';
import { moduleBadge, tasksCountText } from '@/features/games/moduleTasks';
import { useModuleTasks } from '@/features/games/useModuleTasks';
import { spacing } from '@/theme';

const TITLE = 'Tareas de mi profe';
const EMPTY_TITLE = 'Hoy no tienes tareas';

/**
 * Tareas de la profe, una tarjeta por módulo (tema). Cuentan para el
 * progreso de su módulo; no suben los niveles.
 */
export default function TasksScreen() {
  const { resource, reload, refresh } = useModuleTasks();
  // Al volver de un módulo, la lista se actualiza.
  useRefreshOnFocus(refresh);
  const modules = resource.status === 'ready' ? resource.data : null;

  return (
    <Screen
      header={
        <ScreenHeader
          left={<HeaderBackButton onPress={() => router.back()} />}
          title={TITLE}
          right={
            <NarrationButton
              text={
                modules && modules.length === 0
                  ? EMPTY_TITLE
                  : `${TITLE}. Toca un tema.`
              }
            />
          }
        />
      }
    >
      {resource.status === 'loading' ? (
        <StateView kind="loading" title="Buscando tus tareas…" />
      ) : null}
      {resource.status === 'error' ? (
        <StateView
          kind="error"
          title="Vamos a intentarlo otra vez"
          action={{ label: 'Intentar de nuevo', onPress: reload }}
        />
      ) : null}

      {modules && modules.length === 0 ? (
        <View style={styles.center}>
          <Character mouth="smile" size="lg" />
          <AppText variant="title" style={styles.text}>
            {EMPTY_TITLE}
          </AppText>
          <AppText tone="secundario" style={styles.text}>
            Puedes jugar por niveles mientras tanto.
          </AppText>
          <Button
            label="Jugar por niveles"
            size="large"
            onPress={() => router.replace('/student/levels')}
          />
        </View>
      ) : null}

      {modules && modules.length > 0 ? (
        <View style={styles.list}>
          <AppText variant="display" accessibilityRole="header">
            ¿Qué tema quieres hacer?
          </AppText>
          {modules.map((group) => (
            <TaskCard
              key={group.moduleId}
              caption={tasksCountText(group.tasks.length)}
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
