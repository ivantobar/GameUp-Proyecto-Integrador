import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Card, Notice } from '@/components/ui';
import type { StudentTeacher } from '@/data/types';
import { spacing } from '@/theme';
import { isAccessError } from '../assignmentText';
import { assignTeacherRoute } from '../staffRoutes';
import { teacherSinceText } from '../teacherText';
import type { StudentTeachers } from '../useStudentTeachers';
import { Section } from './Section';

interface StudentTeachersSectionProps {
  studentId: string;
  teachers: StudentTeachers;
}

/**
 * «Tallerista a cargo» (solo la directora): quién tiene a cargo al
 * estudiante, «Asignar tallerista» y «Quitar» con confirmación.
 */
export function StudentTeachersSection({
  studentId,
  teachers,
}: StudentTeachersSectionProps) {
  const { resource, message } = teachers;
  const active =
    resource.status === 'ready' ? resource.data.filter((t) => t.active) : [];
  const past =
    resource.status === 'ready'
      ? resource.data.filter(
          (t) => !t.active && !active.some((a) => a.teacherId === t.teacherId),
        )
      : [];

  return (
    <Section title="Tallerista a cargo">
      {message ? (
        <View accessibilityLiveRegion="polite">
          <Notice
            icon={message.tone === 'done' ? 'check' : 'info'}
            tone={message.tone === 'done' ? 'soft' : 'warm'}
            message={message.text}
          />
        </View>
      ) : null}

      {resource.status === 'loading' ? (
        <AppText tone="secundario">Buscando su tallerista…</AppText>
      ) : null}

      {resource.status === 'error' ? (
        <>
          <AppText tone="secundario">
            {isAccessError(resource.error)
              ? 'No puedes ver quién tiene a cargo a este estudiante.'
              : 'No pudimos cargar su tallerista.'}
          </AppText>
          {isAccessError(resource.error) ? null : (
            <Button
              label="Intentar de nuevo"
              variant="secondary"
              onPress={teachers.reload}
            />
          )}
        </>
      ) : null}

      {resource.status === 'ready' ? (
        <>
          {active.length === 0 ? (
            <AppText variant="bodyStrong">Sin tallerista</AppText>
          ) : (
            active.map((teacher) => (
              <TeacherRow
                key={teacher.teacherId}
                teacher={teacher}
                confirming={teachers.confirmingId === teacher.teacherId}
                busy={teachers.busyId === teacher.teacherId}
                onAskRemove={() => teachers.askRemove(teacher.teacherId)}
                onCancel={teachers.cancelRemove}
                onConfirm={() => {
                  teachers.confirmRemove(teacher).catch(() => {});
                }}
              />
            ))
          )}
          {past.length > 0 ? (
            <AppText variant="support" tone="secundario">
              Antes: {past.map((t) => t.displayName).join(', ')}.
            </AppText>
          ) : null}
          <Button
            label="Asignar tallerista"
            variant="secondary"
            accessibilityHint="Abre la lista de talleristas"
            onPress={() => router.push(assignTeacherRoute(studentId))}
          />
        </>
      ) : null}
    </Section>
  );
}

interface TeacherRowProps {
  teacher: StudentTeacher;
  confirming: boolean;
  busy: boolean;
  onAskRemove: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Una tallerista a cargo, desde cuándo y «Quitar» (con confirmación). */
function TeacherRow({
  teacher,
  confirming,
  busy,
  onAskRemove,
  onCancel,
  onConfirm,
}: TeacherRowProps) {
  const since = teacherSinceText(teacher);
  return (
    <Card>
      <View style={styles.row}>
        <View
          accessible
          accessibilityLabel={`${teacher.displayName}. ${since}`}
        >
          <AppText variant="bodyStrong">{teacher.displayName}</AppText>
          <AppText variant="support" tone="secundario">
            {since}
          </AppText>
        </View>

        {confirming ? (
          <View style={styles.confirm} accessibilityLiveRegion="polite">
            <AppText variant="bodyStrong">
              ¿Quitar a {teacher.displayName}? Ya no podrá ver a este
              estudiante.
            </AppText>
            <Button
              label="Sí, quitar"
              variant="warm"
              accessibilityLabel={`Sí, quitar a ${teacher.displayName}`}
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
        ) : (
          <Button
            label="Quitar"
            variant="link"
            accessibilityLabel={`Quitar a ${teacher.displayName}`}
            accessibilityHint="Pide confirmación"
            onPress={onAskRemove}
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
  },
  confirm: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
});
