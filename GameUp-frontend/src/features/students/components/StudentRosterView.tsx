import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  InitialsAvatar,
  PressableCard,
  ProgressBar,
  Screen,
  ScreenHeader,
  StateView,
  TextField,
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
  /** Muestra «Buscar por nombre» (la directora ve a todos). */
  searchable?: boolean;
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
  searchable = false,
}: StudentRosterViewProps) {
  const roster = useStudentRoster();
  const { resource, reload, refresh, rows } = roster;
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
        <>
          {searchable ? (
            <TextField
              label="Buscar por nombre"
              value={roster.query}
              onChangeText={roster.setQuery}
              autoCorrect={false}
              autoCapitalize="none"
              testID="buscar-estudiante"
            />
          ) : null}
          {rows.length === 0 ? (
            <StateView
              kind="empty"
              title="No encontramos a nadie con ese nombre"
              message="Revisa cómo está escrito."
            />
          ) : (
            <View style={styles.list}>
              {rows.map((row) => (
                <StudentRow
                  key={row.student.id}
                  row={row}
                  onPress={() => router.push(routes.detail(row.student.id))}
                />
              ))}
            </View>
          )}
          {roster.hasMore ? (
            <Button
              label="Ver más"
              variant="secondary"
              accessibilityHint={`Hay ${roster.matchCount} en total`}
              onPress={roster.showMore}
            />
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

function StudentRow({ row, onPress }: { row: RosterRow; onPress: () => void }) {
  const { student, percent } = row;
  const progressText =
    percent === undefined
      ? 'Buscando su progreso…'
      : percent === null
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
          {percent === null || percent === undefined ? (
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
