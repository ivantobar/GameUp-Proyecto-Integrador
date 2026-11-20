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
import { EnterStagger } from '@/components/gameup/motion';
import { useRefreshOnFocus } from '@/data/useRefreshOnFocus';
import { TaskCard } from '@/features/games/components/TaskCard';
import { moduleBadge, tasksCountText } from '@/features/games/moduleTasks';
import { useModuleTasks } from '@/features/games/useModuleTasks';
import { spacing } from '@/theme';
import { errorOf, LoadErrorState } from '@/features/errors/LoadErrorState';

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
      backdrop="clouds"
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
        <LoadErrorState
          error={errorOf(resource)}
          title="Vamos a intentarlo otra vez"
          action={{ label: 'Intentar de nuevo', onPress: reload }}
        />
      ) : null}

      {modules && modules.length === 0 ? (
        <View style={styles.center}>
          <Character mouth="smile" eyes="happy" size="lg" />
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
          {modules.map((group, position) => (
            <EnterStagger key={group.moduleId} index={position}>
              <TaskCard
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
            </EnterStagger>
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
