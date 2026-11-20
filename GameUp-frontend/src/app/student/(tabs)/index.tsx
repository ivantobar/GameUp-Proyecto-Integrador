import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Screen, StateView } from '@/components/ui';
import { assignmentHref, findGame } from '@/features/games/catalog';
import {
  GreetingHeader,
  pendingGamesText,
} from '@/features/home/components/GreetingHeader';
import { HomeShortcut } from '@/features/home/components/HomeShortcut';
import { ResumeCard } from '@/features/home/components/ResumeCard';
import { TaskHeroCard } from '@/features/home/components/TaskHeroCard';
import { useStudentHome } from '@/features/home/useStudentHome';
import { spacing } from '@/theme';
import { useScreenRefresh } from '@/features/refresh/useScreenRefresh';
import type { Vowel } from '@/data/types';
import { errorOf, LoadErrorState } from '@/features/errors/LoadErrorState';

/**
 * Pantalla 1 · Inicio del estudiante. Solo compone: saludo, la tarea de la
 * profe en grande («Haz esta tarea») o «Continuar», y debajo accesos
 * pequeños a Juegos y Mi progreso (distinto de la pantalla Juegos).
 */
export default function StudentHome() {
  const { resource, reload, refresh, refreshing, refreshFailed } =
    useStudentHome();
  const screenRefresh = useScreenRefresh({
    refresh,
    refreshing,
    refreshFailed,
  });

  if (resource.status !== 'ready') {
    return (
      <Screen refresh={screenRefresh} backdrop="hills" safeAreaBottom={false}>
        {resource.status === 'loading' ? (
          <StateView kind="loading" title="Preparando tus juegos…" />
        ) : (
          <LoadErrorState
            error={errorOf(resource)}
            title="Vamos a intentarlo otra vez"
            action={{ label: 'Intentar de nuevo', onPress: reload }}
          />
        )}
      </Screen>
    );
  }

  const {
    student,
    pendingCount,
    resume,
    newAssignment,
    gamesCount,
    modulesCount,
  } = resource.data;
  const narration = [
    `¡Hola, ${student.displayName}!`,
    `${pendingGamesText(pendingCount)}.`,
    newAssignment
      ? `Tu profe te dejó ${newAssignment.game.title}. Toca Vamos para empezar.`
      : resume
        ? 'Toca Continuar para seguir donde ibas.'
        : 'Toca Juegos para empezar.',
  ].join(' ');

  // withAnchor: deja la lista de sonidos debajo del paso «Mira».
  const continueResume = (vowel: Vowel) =>
    router.push(
      { pathname: '/student/speak/[vowel]/look', params: { vowel } },
      { withAnchor: true },
    );

  return (
    <Screen
      refresh={screenRefresh}
      backdrop="hills"
      safeAreaBottom={false}
      header={
        <GreetingHeader
          name={student.displayName}
          pendingCount={pendingCount}
          narration={narration}
        />
      }
    >
      {/* Lo primero y más grande: la tarea de la profe o, si no hay, Continuar. */}
      {newAssignment ? (
        <TaskHeroCard
          gameTitle={newAssignment.game.title}
          game={newAssignment.game.id}
          again={newAssignment.assignment.status === 'rejected'}
          onStart={() => router.push(assignmentHref(newAssignment.assignment))}
        />
      ) : resume ? (
        <ResumeCard
          gameTitle={findGame(resume.gameId).title}
          vowel={resume.vowel}
          onContinue={() => continueResume(resume.vowel)}
        />
      ) : null}

      <View style={styles.shortcuts}>
        {newAssignment && resume ? (
          <HomeShortcut
            icon="replay"
            title="Sigue donde ibas"
            subtitle={`${findGame(resume.gameId).title} · Sonido ${resume.vowel.toUpperCase()}`}
            onPress={() => continueResume(resume.vowel)}
          />
        ) : null}
        <HomeShortcut
          icon="game"
          title="Juegos"
          subtitle={`${gamesCount} juegos`}
          onPress={() => router.navigate('/student/games')}
        />
        <HomeShortcut
          icon="starOutline"
          title="Mi progreso"
          subtitle={`${modulesCount} temas`}
          onPress={() => router.navigate('/student/progress')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  shortcuts: {
    gap: spacing.sm,
  },
});
