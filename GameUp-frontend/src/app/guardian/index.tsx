import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  FilterChip,
  HeaderBackButton,
  Notice,
  NumberedSteps,
  Screen,
  ScreenHeader,
  StateView,
} from '@/components/ui';
import { firstName } from '@/data/studentName';
import { useRefreshOnFocus } from '@/data/useRefreshOnFocus';
import type { PracticeDay } from '@/data/types';
import { SignOutButton } from '@/features/auth/components/SignOutButton';
import { ActivityFeedbackCard } from '@/features/home-practice/components/ActivityFeedbackCard';
import { TeacherNoteCard } from '@/features/home-practice/components/TeacherNoteCard';
import { TeacherVideoCard } from '@/features/home-practice/components/TeacherVideoCard';
import { homeSteps } from '@/features/home-practice/homeSteps';
import { useWeeklyPractice } from '@/features/home-practice/useWeeklyPractice';
import { colors, radii, spacing } from '@/theme';

/** «Esta semana practicaron 2 días.» */
function daysText(days: readonly PracticeDay[]): string {
  const count = days.filter((day) => day.practiced).length;
  if (count === 0) return 'Esta semana todavía no han practicado en casa.';
  return count === 1
    ? 'Esta semana practicaron 1 día.'
    : `Esta semana practicaron ${count} días.`;
}

/** Pantalla 9 · Acudiente: «Practicar en casa». */
export default function GuardianPracticeScreen() {
  const {
    resource,
    reload,
    refresh,
    markState,
    markPracticedToday,
    selectStudent,
  } = useWeeklyPractice();
  useRefreshOnFocus(refresh);

  const week = resource.status === 'ready' ? resource.data.week : null;
  const students = resource.status === 'ready' ? resource.data.students : [];

  const footer = week ? (
    week.practicedToday ? (
      <View accessibilityLiveRegion="polite">
        <Notice
          icon="check"
          tone="soft"
          title="¡Lo practicaron hoy!"
          message="Quedó en el seguimiento. Mañana pueden volver a practicar."
        />
      </View>
    ) : (
      <Button
        label="Lo practicamos hoy"
        size="large"
        loading={markState === 'saving'}
        accessibilityHint="Avisa a la profe que hoy practicaron en casa."
        onPress={() => {
          markPracticedToday().catch(() => {});
        }}
      />
    )
  ) : undefined;

  return (
    <Screen
      header={
        <ScreenHeader
          left={
            // Después de iniciar sesión no hay pantalla anterior.
            router.canGoBack() ? (
              <HeaderBackButton onPress={() => router.back()} />
            ) : undefined
          }
          title="Practicar en casa"
          right={<SignOutButton />}
        />
      }
      footer={footer}
    >
      {resource.status === 'loading' ? (
        <StateView kind="loading" title="Preparando la práctica…" />
      ) : null}
      {resource.status === 'error' ? (
        <StateView
          kind="error"
          title="No pudimos cargar la práctica"
          message="Revisa la conexión."
          action={{ label: 'Intentar de nuevo', onPress: reload }}
        />
      ) : null}

      {week ? (
        <>
          {students.length > 1 ? (
            // Si acompaña a varios estudiantes, elige a quién ver.
            <View style={styles.chips}>
              {students.map((student) => (
                <FilterChip
                  key={student.id}
                  label={firstName(student.displayName)}
                  selected={student.id === week.student.id}
                  onPress={() => selectStudent(student.id)}
                />
              ))}
            </View>
          ) : null}

          <View
            style={styles.pill}
            accessible
            accessibilityRole="header"
            accessibilityLabel={
              week.vowel
                ? `${week.student.displayName}. Esta semana practican el sonido ${week.vowel}.`
                : `${week.student.displayName}. Esta semana no hay un sonido asignado.`
            }
          >
            <AppText variant="bodyStrong" tone="marca">
              {week.student.initials}
            </AppText>
            <AppText variant="bodyStrong" tone="marca">
              {week.vowel
                ? `${firstName(week.student.displayName)} · esta semana: sonido ${week.vowel.toUpperCase()}`
                : `${firstName(week.student.displayName)} · esta semana: sin sonido asignado`}
            </AppText>
          </View>

          {week.vowel ? (
            <>
              <TeacherVideoCard />
              <Card>
                <View style={styles.steps}>
                  <AppText variant="subtitle" accessibilityRole="header">
                    Así lo practican
                  </AppText>
                  <NumberedSteps steps={homeSteps(week.vowel)} />
                </View>
              </Card>
            </>
          ) : (
            <Notice
              icon="info"
              tone="soft"
              message="La profe todavía no dejó un sonido para practicar en casa. Mientras tanto, pueden repasar los que ya conoce."
            />
          )}

          {week.teacherNote ? (
            <TeacherNoteCard note={week.teacherNote} />
          ) : null}

          {week.feedback && week.feedback.length > 0 ? (
            <ActivityFeedbackCard feedback={week.feedback} />
          ) : null}

          {week.days ? (
            <AppText variant="support" tone="secundario">
              {daysText(week.days)}
            </AppText>
          ) : null}

          {markState === 'error' ? (
            <Notice
              icon="offline"
              tone="warm"
              message="No se pudo guardar. Revisa la conexión e inténtalo otra vez."
            />
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.verde.suave,
  },
  steps: {
    gap: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
