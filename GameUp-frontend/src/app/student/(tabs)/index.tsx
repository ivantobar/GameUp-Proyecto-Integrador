import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Screen, StateView } from '@/components/ui';
import { GameCard } from '@/components/gameup';
import { findGame, gameHref } from '@/features/games/catalog';
import { AssignmentNotice } from '@/features/home/components/AssignmentNotice';
import {
  GreetingHeader,
  pendingGamesText,
} from '@/features/home/components/GreetingHeader';
import { ResumeCard } from '@/features/home/components/ResumeCard';
import { useStudentHome } from '@/features/home/useStudentHome';
import { spacing } from '@/theme';
import { useRefreshOnFocus } from '@/data/useRefreshOnFocus';

/** Pantalla 1 · Inicio del estudiante. Solo compone. */
export default function StudentHome() {
  const { resource, reload, refresh } = useStudentHome();
  useRefreshOnFocus(refresh);

  if (resource.status !== 'ready') {
    return (
      <Screen safeAreaBottom={false}>
        {resource.status === 'loading' ? (
          <StateView kind="loading" title="Preparando tus juegos…" />
        ) : (
          <StateView
            kind="error"
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
    resume
      ? 'Toca Continuar para seguir donde ibas.'
      : 'Toca Juegos para empezar.',
  ].join(' ');

  return (
    <Screen
      safeAreaBottom={false}
      header={
        <GreetingHeader
          name={student.displayName}
          pendingCount={pendingCount}
          narration={narration}
        />
      }
    >
      {resume ? (
        <ResumeCard
          gameTitle={findGame(resume.gameId).title}
          vowel={resume.vowel}
          onContinue={() =>
            // withAnchor: deja la lista de sonidos debajo del paso «Mira».
            router.push(
              {
                pathname: '/student/speak/[vowel]/look',
                params: { vowel: resume.vowel },
              },
              { withAnchor: true },
            )
          }
        />
      ) : null}

      <View style={styles.row}>
        <GameCard
          tone="warm"
          icon="game"
          title="Juegos"
          subtitle={`${gamesCount} juegos`}
          onPress={() => router.navigate('/student/games')}
        />
        <GameCard
          tone="surface"
          icon="starOutline"
          title="Mi progreso"
          subtitle={`${modulesCount} temas`}
          onPress={() => router.navigate('/student/progress')}
        />
      </View>

      {newAssignment ? (
        <AssignmentNotice
          gameTitle={newAssignment.game.title}
          icon={newAssignment.game.icon}
          onPress={() => router.push(gameHref(newAssignment.game))}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
