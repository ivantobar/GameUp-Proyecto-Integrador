import { useCallback } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Badge,
  Button,
  Card,
  HeaderBackButton,
  InitialsAvatar,
  Notice,
  Screen,
  ScreenHeader,
  StateView,
  toPercent,
} from '@/components/ui';
import { useRefreshOnFocus } from '@/data/useRefreshOnFocus';
import type { StudentAssignment } from '@/data/types';
import { StudentLevelsList } from '@/features/levels/components/StudentLevels';
import { useStudentLevels } from '@/features/levels/useStudentLevels';
import { toReviewText } from '@/features/review/reviewText';
import { usePendingSummary } from '@/features/review/usePendingSummary';
import { ModuleProgressCard } from '@/features/progress/components/ModuleProgressCard';
import { moduleDefinitionFor } from '@/features/progress/modules';
import { spacing } from '@/theme';
import {
  takeAssignedNotice,
  takeLevelNotice,
  takeTeacherNotice,
} from '../assignmentNotice';
import {
  assignmentStateLabels,
  assignmentSummary,
  isAccessError,
} from '../assignmentText';
import type { StaffRoutes } from '../staffRoutes';
import { useStudentDetail } from '../useStudentDetail';
import { useStudentTeachers } from '../useStudentTeachers';
import { Section } from './Section';
import { StudentRecordingsSection } from './StudentRecordingsSection';
import { StudentTeachersSection } from './StudentTeachersSection';
import { Illustration } from '@/components/gameup';
import {
  combineRefreshables,
  useScreenRefresh,
} from '@/features/refresh/useScreenRefresh';

interface StudentDetailViewProps {
  studentId: string;
  routes: StaffRoutes;
  /**
   * Muestra «Tallerista a cargo» (asignar y quitar). Solo la directora: el
   * backend no deja al docente.
   */
  manageTeachers?: boolean;
  /**
   * Muestra «Grabaciones de voz» (borrar todas las del estudiante). Solo la
   * directora: el backend no deja al docente.
   */
  manageRecordings?: boolean;
}

/**
 * Detalle de un estudiante (docente y directora): progreso oficial por
 * módulo, niveles por juego, asignaciones y «Asignar actividad». La
 * directora ve además «Tallerista a cargo» y «Grabaciones de voz».
 */
export function StudentDetailView({
  studentId,
  routes,
  manageTeachers = false,
  manageRecordings = false,
}: StudentDetailViewProps) {
  const detail = useStudentDetail(studentId);
  const { resource, reload, message, showAssignedNotice, showNotice } = detail;
  // Niveles por juego: se recargan al volver de «Cambiar nivel».
  const levels = useStudentLevels(studentId);
  const teachers = useStudentTeachers(studentId, manageTeachers);
  const { showAssignedNotice: showTeacherNotice } = teachers;
  // Cuántas actividades suyas esperan revisión (las mismas de su bandeja).
  const pendingSummary = usePendingSummary();
  const pendingCount =
    pendingSummary.resource.status === 'ready'
      ? (pendingSummary.resource.data.find((r) => r.student.id === studentId)
          ?.pending ?? 0)
      : 0;

  // Al volver de «Asignar», «Cambiar nivel» o «Tallerista»: el aviso de lo
  // que se hizo. Los datos se recargan con `useScreenRefresh` (abajo).
  const onFocus = useCallback(() => {
    const assignedTitle = takeAssignedNotice(studentId);
    if (assignedTitle !== null) showAssignedNotice(assignedTitle);
    const levelNotice = takeLevelNotice(studentId);
    if (levelNotice !== null) showNotice(levelNotice);
    if (manageTeachers && takeTeacherNotice(studentId)) showTeacherNotice();
  }, [
    studentId,
    showAssignedNotice,
    showNotice,
    manageTeachers,
    showTeacherNotice,
  ]);
  useRefreshOnFocus(onFocus);

  // Recargar: el estudiante, sus niveles, sus pendientes y (si la
  // directora las gestiona) sus talleristas. Al volver a la pantalla, al
  // volver la app, al deslizar o con «Actualizar».
  const screenRefresh = useScreenRefresh(
    combineRefreshables(
      manageTeachers
        ? [detail, levels, pendingSummary, teachers]
        : [detail, levels, pendingSummary],
    ),
  );

  return (
    <Screen
      refresh={screenRefresh}
      header={
        <ScreenHeader
          left={<HeaderBackButton onPress={() => router.back()} />}
          title="Estudiante"
          refresh={screenRefresh}
        />
      }
      footer={
        resource.status === 'ready' ? (
          <Button
            label="Asignar actividad"
            icon="check"
            size="large"
            onPress={() => router.push(routes.assign(studentId))}
          />
        ) : undefined
      }
    >
      {resource.status === 'loading' ? (
        <StateView kind="loading" title="Buscando sus datos…" />
      ) : null}
      {resource.status === 'error' ? (
        isAccessError(resource.error) ? (
          <StateView
            kind="error"
            title="No puedes ver a este estudiante"
            message="Si debería estar a tu cargo, habla con la fundación."
          />
        ) : (
          <StateView
            kind="error"
            title="No pudimos cargar sus datos"
            message="Revisa la conexión."
            action={{ label: 'Intentar de nuevo', onPress: reload }}
          />
        )
      ) : null}

      {resource.status === 'ready' ? (
        <>
          <View style={styles.identity}>
            <InitialsAvatar initials={resource.data.student.initials} />
            <AppText variant="title" accessibilityRole="header">
              {resource.data.student.displayName}
            </AppText>
          </View>

          {pendingCount > 0 ? (
            <Button
              label={`${routes.reviewTitle} (${pendingCount})`}
              icon="ear"
              variant="secondary"
              accessibilityLabel={`${routes.reviewTitle}: ${toReviewText(pendingCount)}`}
              accessibilityHint="Abre sus actividades por revisar"
              onPress={() =>
                router.push(
                  routes.review(studentId, resource.data.student.displayName),
                )
              }
            />
          ) : null}

          {message ? (
            <View accessibilityLiveRegion="polite">
              <Notice
                icon={message.tone === 'done' ? 'check' : 'info'}
                tone={message.tone === 'done' ? 'soft' : 'warm'}
                message={message.text}
              />
            </View>
          ) : null}

          {manageTeachers ? (
            <StudentTeachersSection studentId={studentId} teachers={teachers} />
          ) : null}

          <Section title="Progreso oficial">
            {resource.data.progress.modules.length === 0 ? (
              <AppText tone="secundario">
                Todavía no tiene módulos asignados.
              </AppText>
            ) : (
              resource.data.progress.modules.map((progress) => (
                <ModuleProgressCard
                  key={progress.moduleId}
                  module={moduleDefinitionFor(progress)}
                  percent={toPercent(progress.validated, progress.total)}
                />
              ))
            )}
            {resource.data.progress.pendingValidation > 0 ? (
              <AppText variant="support" tone="secundario">
                {resource.data.progress.pendingValidation === 1
                  ? '1 actividad espera tu validación; todavía no suma.'
                  : `${resource.data.progress.pendingValidation} actividades esperan tu validación; todavía no suman.`}
              </AppText>
            ) : null}
          </Section>

          {levels.resource.status === 'ready' &&
          levels.resource.data.length > 0 ? (
            <>
              <StudentLevelsList levels={levels.resource.data} />
              <Button
                label="Cambiar nivel"
                icon="game"
                size="large"
                variant="secondary"
                accessibilityLabel="Cambiar el nivel de sus juegos"
                accessibilityHint={
                  routes.canRaiseLevels
                    ? 'Puedes subirlo o bajarlo, con un motivo'
                    : 'Solo puedes bajarlo, con un motivo'
                }
                onPress={() => router.push(routes.levels(studentId))}
              />
            </>
          ) : null}

          {manageRecordings ? (
            <StudentRecordingsSection studentId={studentId} />
          ) : null}

          <Section title="Asignaciones">
            {resource.data.assignments.length === 0 ? (
              <StateView
                kind="empty"
                title="Sin asignaciones"
                message="Toca «Asignar actividad» para empezar."
                visual={<Illustration name="box" size="md" />}
              />
            ) : (
              resource.data.assignments.map((assignment) => (
                <AssignmentRow
                  key={assignment.id}
                  assignment={assignment}
                  confirming={detail.confirmingId === assignment.id}
                  busy={detail.busyId === assignment.id}
                  problem={
                    detail.rowMessage?.assignmentId === assignment.id
                      ? detail.rowMessage.text
                      : null
                  }
                  onAskRemove={() => detail.askRemove(assignment.id)}
                  onCancel={detail.cancelRemove}
                  onConfirm={() => {
                    detail.confirmRemove(assignment).catch(() => {});
                  }}
                />
              ))
            )}
          </Section>
        </>
      ) : null}
    </Screen>
  );
}

interface AssignmentRowProps {
  assignment: StudentAssignment;
  confirming: boolean;
  busy: boolean;
  /** Por qué no se pudo quitar (se muestra en esta tarjeta). */
  problem: string | null;
  onAskRemove: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Una asignación con su estado en palabras y «Quitar» (con confirmación). */
function AssignmentRow({
  assignment,
  confirming,
  busy,
  problem,
  onAskRemove,
  onCancel,
  onConfirm,
}: AssignmentRowProps) {
  return (
    <Card>
      <View style={styles.assignment}>
        <View style={styles.assignmentHead}>
          <AppText variant="bodyStrong" style={styles.flex}>
            {assignment.moduleTitle}
          </AppText>
          <Badge
            label={assignmentStateLabels[assignment.state]}
            tone={assignment.state === 'completed' ? 'brand' : 'neutral'}
          />
        </View>
        <AppText variant="support" tone="secundario">
          {assignmentSummary(assignment)}
        </AppText>

        {problem ? (
          <View accessibilityLiveRegion="polite">
            <Notice icon="info" tone="warm" message={problem} />
          </View>
        ) : null}

        {confirming ? (
          <View style={styles.confirm} accessibilityLiveRegion="polite">
            <AppText variant="bodyStrong">
              ¿Quitar «{assignment.moduleTitle}»? No se puede deshacer.
            </AppText>
            <Button
              label="Sí, quitar"
              variant="warm"
              loading={busy}
              onPress={onConfirm}
            />
            <Button
              label="Cancelar"
              variant="secondary"
              disabled={busy}
              onPress={onCancel}
            />
          </View>
        ) : assignment.state !== 'completed' ? (
          <Button
            label="Quitar"
            variant="link"
            accessibilityHint={`Quita ${assignment.moduleTitle}. Pide confirmación.`}
            onPress={onAskRemove}
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  assignment: {
    gap: spacing.xs,
  },
  assignmentHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  confirm: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
});
