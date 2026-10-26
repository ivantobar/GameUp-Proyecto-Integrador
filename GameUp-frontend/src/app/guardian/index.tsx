import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  HeaderBackButton,
  Notice,
  NumberedSteps,
  Screen,
  ScreenHeader,
  StateView,
} from '@/components/ui';
import { firstName } from '@/data/studentName';
import { useRefreshOnFocus } from '@/data/useRefreshOnFocus';
import { TeacherNoteCard } from '@/features/home-practice/components/TeacherNoteCard';
import { TeacherVideoCard } from '@/features/home-practice/components/TeacherVideoCard';
import { homeSteps } from '@/features/home-practice/homeSteps';
import { useWeeklyPractice } from '@/features/home-practice/useWeeklyPractice';
import { colors, radii, spacing } from '@/theme';

/** Pantalla 9 · Acudiente: «Practicar en casa». */
export default function GuardianPracticeScreen() {
  const { resource, reload, refresh, markState, markPracticedToday } =
    useWeeklyPractice();
  useRefreshOnFocus(refresh);

  const week = resource.status === 'ready' ? resource.data.week : null;

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
          <View
            style={styles.pill}
            accessible
            accessibilityRole="header"
            accessibilityLabel={`${week.student.displayName}. Esta semana practican el sonido ${week.vowel}.`}
          >
            <AppText variant="bodyStrong" tone="marca">
              {week.student.initials}
            </AppText>
            <AppText variant="bodyStrong" tone="marca">
              {firstName(week.student.displayName)} · esta semana: sonido{' '}
              {week.vowel.toUpperCase()}
            </AppText>
          </View>

          <TeacherVideoCard />

          <Card>
            <View style={styles.steps}>
              <AppText variant="subtitle" accessibilityRole="header">
                Así lo practican
              </AppText>
              <NumberedSteps steps={homeSteps(week.vowel)} />
            </View>
          </Card>

          {week.teacherNote ? (
            <TeacherNoteCard note={week.teacherNote} />
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
});
