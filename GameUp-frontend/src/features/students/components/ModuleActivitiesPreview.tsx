import { StyleSheet, View } from 'react-native';
import { AppText, Button, Card, Icon, Notice } from '@/components/ui';
import { findGame } from '@/features/games/catalog';
import { colors, spacing } from '@/theme';
import { moduleActivitiesTitle } from '../assignmentText';
import { useModuleActivities } from '../useModuleActivities';

/** Cuántas se muestran; las demás se resumen en «Y 4 más». */
export const VISIBLE_ACTIVITIES = 6;

interface ModuleActivitiesPreviewProps {
  moduleId: string;
  moduleTitle: string;
}

/**
 * «Asignar actividad» · qué trae el módulo elegido: sus actividades activas
 * (las mismas que verá el estudiante), con su juego. Si no cargan, se
 * puede asignar igual. Montar con `key={moduleId}`.
 */
export function ModuleActivitiesPreview({
  moduleId,
  moduleTitle,
}: ModuleActivitiesPreviewProps) {
  const { resource, reload } = useModuleActivities(moduleId);

  if (resource.status === 'loading') {
    return (
      <AppText variant="support" tone="secundario">
        Buscando las actividades de «{moduleTitle}»…
      </AppText>
    );
  }

  if (resource.status === 'error') {
    return (
      <View accessibilityLiveRegion="polite">
        <Notice
          icon="offline"
          tone="warm"
          message={`No pudimos ver las actividades de «${moduleTitle}». Igual puedes asignarlo.`}
          action={
            <Button
              label="Intentar de nuevo"
              variant="secondary"
              onPress={reload}
            />
          }
        />
      </View>
    );
  }

  const activities = resource.data;
  if (activities.length === 0) {
    return (
      <AppText variant="support" tone="secundario">
        «{moduleTitle}» todavía no tiene actividades.
      </AppText>
    );
  }

  const visible = activities.slice(0, VISIBLE_ACTIVITIES);
  const hidden = activities.length - visible.length;

  return (
    <Card>
      <View style={styles.list} testID={`actividades-${moduleId}`}>
        <AppText variant="label" tone="secundario" accessibilityRole="header">
          {moduleActivitiesTitle(activities.length)}
        </AppText>
        {visible.map((activity) => {
          const game = findGame(activity.gameId);
          return (
            <View
              key={activity.id}
              style={styles.row}
              accessible
              accessibilityLabel={`${activity.title}, ${game.title}`}
            >
              <Icon name={game.icon} color={colors.marca.verde} />
              <View style={styles.texts}>
                <AppText variant="bodyStrong">{activity.title}</AppText>
                <AppText variant="support" tone="secundario">
                  {game.title}
                </AppText>
              </View>
            </View>
          );
        })}
        {hidden > 0 ? (
          <AppText variant="support" tone="secundario">
            Y {hidden} más.
          </AppText>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  texts: {
    flex: 1,
  },
});
