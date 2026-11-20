import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Card,
  HeaderBackButton,
  Screen,
  ScreenHeader,
  StateView,
} from '@/components/ui';
import { Character, NarrationButton, SoundTile } from '@/components/gameup';
import { VowelsDoneMeter } from '@/features/speak/components/VowelsDoneMeter';
import { speakSelectionNarration } from '@/features/speak/practice';
import { useVowelSelection } from '@/features/speak/useVowelSelection';
import { spacing } from '@/theme';
import { useScreenRefresh } from '@/features/refresh/useScreenRefresh';
import { errorOf, LoadErrorState } from '@/features/errors/LoadErrorState';

const INSTRUCTION = 'Toca un sonido para practicar';

/**
 * Pantalla 3 · Habla conmigo, selección de sonido. En el MVP solo hay
 * vocales: sílabas y palabras quedan para la segunda etapa.
 */
export default function SpeakSelectionScreen() {
  const { resource, reload, refresh, refreshing, refreshFailed } =
    useVowelSelection();
  // Al volver de una práctica, la ficha muestra la estrella nueva.
  const screenRefresh = useScreenRefresh({
    refresh,
    refreshing,
    refreshFailed,
  });
  // Con los datos, la narración dice cuándo se termina una vocal y cuántas van.
  const narration =
    resource.status === 'ready'
      ? speakSelectionNarration(
          resource.data.practicedCount,
          resource.data.total,
        )
      : INSTRUCTION;

  return (
    <Screen
      refresh={screenRefresh}
      tone="softGreen"
      backdrop="clouds"
      header={
        <ScreenHeader
          left={<HeaderBackButton onPress={() => router.back()} />}
          title="Habla conmigo"
          right={<NarrationButton text={narration} />}
        />
      }
      footer={
        resource.status === 'ready' ? (
          <Card>
            <VowelsDoneMeter vowels={resource.data.vowels} />
          </Card>
        ) : undefined
      }
    >
      <Card>
        <View style={styles.instruction}>
          <Character mouth="a" size="sm" wave />
          <AppText variant="subtitle" style={styles.flex}>
            {INSTRUCTION}
          </AppText>
        </View>
      </Card>

      {resource.status === 'loading' ? (
        <StateView kind="loading" title="Preparando los sonidos…" />
      ) : null}
      {resource.status === 'error' ? (
        <LoadErrorState
          error={errorOf(resource)}
          title="Vamos a intentarlo otra vez"
          action={{ label: 'Intentar de nuevo', onPress: reload }}
        />
      ) : null}

      {resource.status === 'ready' ? (
        <View style={styles.grid}>
          {resource.data.vowels.map(({ vowel, stars }) => (
            <SoundTile
              key={vowel}
              letter={vowel.toUpperCase()}
              stars={stars}
              accessibilityHint="Abre la práctica de este sonido"
              onPress={() =>
                router.push({
                  pathname: '/student/speak/[vowel]/look',
                  params: { vowel },
                })
              }
            />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
