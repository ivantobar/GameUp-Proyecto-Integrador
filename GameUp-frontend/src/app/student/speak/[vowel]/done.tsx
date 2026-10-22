import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  HeaderCloseButton,
  Icon,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import {
  AudioClipRow,
  Celebration,
  Character,
  NarrationButton,
} from '@/components/gameup';
import { exitPractice } from '@/features/speak/components/PracticeHeader';
import { usePracticeSession } from '@/features/speak/PracticeSession';
import { useAttemptPlayback } from '@/features/speak/useAttemptPlayback';
import { parseVowel } from '@/features/speak/vowelContent';
import { colors, sizes, spacing } from '@/theme';

/**
 * Pantalla 6 · Paso 3 «Listo». Siempre hay celebración por intentar. La app
 * no califica: la grabación queda pendiente de validación del profe.
 */
export default function DoneStep() {
  const params = useLocalSearchParams<{ vowel: string }>();
  const vowel = parseVowel(params.vowel);
  const letter = vowel.toUpperCase();
  const { outcome } = usePracticeSession();
  const audioUri = outcome?.vowel === vowel ? outcome.attempt.audioUri : null;
  const voiceConsent = outcome?.voiceConsent ?? false;
  const { playModel, playAttempt, attemptPlaying } = useAttemptPlayback(
    vowel,
    audioUri,
  );

  const name = outcome?.studentName;
  const cheer = name ? `¡Muy bien, ${name}!` : '¡Muy bien!';
  const reviewText = audioUri
    ? 'Tu profe lo va a escuchar antes de sumarlo a tu progreso'
    : 'Tu profe lo revisará contigo en la próxima sesión';

  return (
    <Screen
      tone="brand"
      header={
        <ScreenHeader
          left={
            <HeaderCloseButton
              accessibilityLabel="Salir de la práctica"
              onPress={exitPractice}
            />
          }
          right={
            <NarrationButton
              text={`${cheer} Dijiste la ${letter}. ${reviewText}.`}
            />
          }
        />
      }
      footer={
        <>
          <Button
            label="Otro sonido"
            variant="accent"
            size="large"
            onPress={exitPractice}
          />
          <Button
            label="Decirlo otra vez"
            variant="secondary"
            size="large"
            onPress={() =>
              router.replace({
                pathname: '/student/speak/[vowel]/say',
                params: { vowel },
              })
            }
          />
        </>
      }
    >
      <View style={styles.center}>
        <Celebration
          width={sizes.character.lg + 80}
          height={sizes.character.md + 24}
        >
          <Character mouth="smile" size="md" />
        </Celebration>

        <View
          style={styles.stars}
          accessible
          accessibilityLabel="Tres estrellas por intentarlo"
        >
          <Icon name="star" size="xl" color={colors.marca.naranja} />
          <Icon name="star" size="xl" color={colors.marca.naranja} />
          <Icon name="star" size="xl" color={colors.marca.naranja} />
        </View>

        <AppText
          variant="display"
          tone="sobreOscuro"
          accessibilityRole="header"
          style={styles.text}
        >
          {cheer}
        </AppText>
        <AppText tone="sobreOscuro" style={styles.text}>
          Dijiste la {letter}
        </AppText>
      </View>

      <Card>
        <AudioClipRow kind="model" label="Así suena" onPlay={playModel} />
        {audioUri ? (
          <AudioClipRow
            kind="attempt"
            label="Así lo dijiste tú"
            playing={attemptPlaying}
            onPlay={playAttempt}
          />
        ) : null}
        <View style={styles.review}>
          <Icon name="time" color={colors.texto.secundario} />
          <AppText variant="support" tone="secundario" style={styles.flex}>
            {reviewText}
          </AppText>
        </View>
        {!voiceConsent && outcome ? (
          <AppText variant="support" tone="secundario">
            Tu voz no se grabó porque no hay autorización de tu acudiente.
          </AppText>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  text: {
    textAlign: 'center',
  },
  review: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  flex: {
    flex: 1,
  },
});
