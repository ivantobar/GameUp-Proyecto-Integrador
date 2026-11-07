import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  InitialsAvatar,
  PressableCard,
  ProgressBar,
  Screen,
  ScreenHeader,
  StateView,
} from '@/components/ui';
import { useRefreshOnFocus } from '@/data/useRefreshOnFocus';
import { spacing } from '@/theme';
import type { StaffRoutes } from '../staffRoutes';
import { useStudentRoster, type RosterRow } from '../useStudentRoster';

interface StudentRosterViewProps {
  title: string;
  routes: StaffRoutes;
  /** Texto cuando no hay estudiantes. */
  emptyTitle: string;
  emptyMessage?: string;
  headerRight?: ReactNode;
}

/**
 * Lista de estudiantes con su progreso oficial. La usan el docente («Mis
 * estudiantes») y la directora («Estudiantes»). Al volver a la pestaña
 * (por ejemplo, después de asignar), se actualiza sin ocultar la lista.
 */
export function StudentRosterView({
  title,
  routes,
  emptyTitle,
  emptyMessage,
  headerRight,
}: StudentRosterViewProps) {
  const { resource, reload, refresh } = useStudentRoster();
  useRefreshOnFocus(refresh);

  return (
    <Screen
      safeAreaBottom={false}
      header={<ScreenHeader title={title} right={headerRight} />}
    >
      {resource.status === 'loading' ? (
        <StateView kind="loading" title="Buscando estudiantes…" />
      ) : null}
      {resource.status === 'error' ? (
        <StateView
          kind="error"
          title="No pudimos cargar a los estudiantes"
          message="Revisa la conexión."
          action={{ label: 'Intentar de nuevo', onPress: reload }}
        />
      ) : null}
      {resource.status === 'ready' && resource.data.length === 0 ? (
        <StateView kind="empty" title={emptyTitle} message={emptyMessage} />
      ) : null}
      {resource.status === 'ready' && resource.data.length > 0 ? (
        <View style={styles.list}>
          {resource.data.map((row) => (
            <StudentRow
              key={row.student.id}
              row={row}
              onPress={() => router.push(routes.detail(row.student.id))}
            />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function StudentRow({ row, onPress }: { row: RosterRow; onPress: () => void }) {
  const { student, percent } = row;
  const progressText =
    percent === null
      ? 'Progreso no disponible'
      : `Progreso oficial: ${percent} %`;
  return (
    <PressableCard
      onPress={onPress}
      accessibilityLabel={`${student.displayName}. ${progressText}`}
      accessibilityHint="Abre su detalle"
    >
      <View style={styles.row}>
        <InitialsAvatar initials={student.initials} />
        <View style={styles.texts}>
          <AppText variant="bodyStrong">{student.displayName}</AppText>
          {percent === null ? (
            <AppText variant="support" tone="secundario">
              {progressText}
            </AppText>
          ) : (
            <ProgressBar
              value={percent}
              max={100}
              label={progressText}
              tone="official"
            />
          )}
        </View>
      </View>
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  texts: {
    flex: 1,
    gap: spacing.xxs,
  },
});
