import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  InitialsAvatar,
  Notice,
  PressableCard,
  Screen,
  ScreenHeader,
  StateView,
} from '@/components/ui';
import type { PendingReviewSummary } from '@/data/types';
import { useRefreshOnFocus } from '@/data/useRefreshOnFocus';
import { SignOutButton } from '@/features/auth/components/SignOutButton';
import { formatSubmittedAt } from '@/features/review/formatTime';
import {
  toReviewText,
  waitingStudentsTitle,
} from '@/features/review/reviewText';
import { usePendingSummary } from '@/features/review/usePendingSummary';
import type { StaffRoutes } from '@/features/students/staffRoutes';
import { spacing } from '@/theme';

interface PendingStudentsViewProps {
  routes: StaffRoutes;
  /**
   * Aviso «Gestos de la fundación» (grabar el gesto de cada sonido). Es
   * tarea de la tallerista; la directora no lo ve.
   */
  showGestureNotice?: boolean;
}

/**
 * Pestaña «Por revisar» (docente) y «Por validar» (directora): primero se
 * elige el estudiante y luego se revisan solo sus actividades. Los conteos
 * vienen del backend (los mismos que su bandeja). Al volver de un
 * estudiante, la lista se recarga: quien quedó al día desaparece.
 */
export function PendingStudentsView({
  routes,
  showGestureNotice = true,
}: PendingStudentsViewProps) {
  const { resource, reload, refresh } = usePendingSummary();
  useRefreshOnFocus(refresh);

  return (
    <Screen
      // Dentro de las pestañas: la barra inferior ya respeta el borde.
      safeAreaBottom={false}
      header={
        <ScreenHeader title={routes.reviewTitle} right={<SignOutButton />} />
      }
    >
      {resource.status === 'loading' ? (
        <StateView kind="loading" title="Buscando actividades…" />
      ) : null}
      {resource.status === 'error' ? (
        <StateView
          kind="error"
          title="No pudimos cargar las actividades"
          message="Revisa la conexión."
          action={{ label: 'Intentar de nuevo', onPress: reload }}
        />
      ) : null}

      {resource.status === 'ready' ? (
        <>
          <AppText variant="title" accessibilityRole="header">
            {waitingStudentsTitle(resource.data.length)}
          </AppText>

          {resource.data.length === 0 ? (
            <StateView
              kind="empty"
              title="No hay nada por revisar"
              message="Cuando un estudiante termine una actividad, aparecerá aquí."
            />
          ) : (
            <View style={styles.list}>
              {resource.data.map((row) => (
                <PendingStudentCard
                  key={row.student.id}
                  row={row}
                  onPress={() =>
                    router.push(
                      routes.review(row.student.id, row.student.displayName),
                    )
                  }
                />
              ))}
            </View>
          )}

          {showGestureNotice ? (
            <Notice
              icon="video"
              tone="warm"
              title="Gestos de la fundación"
              message="Graba el gesto de cada sonido. Es el video que ven los niños en «Ver el gesto». Llega en una próxima versión."
              action={
                <Button
                  label="Grabar un gesto"
                  icon="video"
                  variant="secondary"
                  disabled
                  accessibilityHint="Próximamente"
                  onPress={() => {}}
                />
              }
            />
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

interface PendingStudentCardProps {
  row: PendingReviewSummary;
  onPress: () => void;
}

/** Un estudiante: iniciales, nombre, cuántas actividades y desde cuándo. */
function PendingStudentCard({ row, onPress }: PendingStudentCardProps) {
  const count = toReviewText(row.pending);
  return (
    <PressableCard
      onPress={onPress}
      accessibilityLabel={`${row.student.displayName}, ${count}`}
      accessibilityHint="Abre sus actividades por revisar"
    >
      <View style={styles.row}>
        <InitialsAvatar initials={row.student.initials} />
        <View style={styles.texts}>
          <AppText variant="bodyStrong">{row.student.displayName}</AppText>
          <AppText>{count}</AppText>
          <AppText variant="support" tone="secundario">
            Espera desde {formatSubmittedAt(row.oldestAt)}
          </AppText>
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
