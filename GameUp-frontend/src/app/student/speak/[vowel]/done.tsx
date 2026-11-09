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
import {
  NOT_SENT_ADULT_TEXT,
  parseActivityId,
  PRACTICE_TEXT,
} from '@/features/games/delivery';
import { notRecordedText } from '@/features/speak/completePractice';
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
  const params = useLocalSearchParams<{
    vowel: string;
    actividadId?: string;
  }>();
  const vowel = parseVowel(params.vowel);
  const activityId = parseActivityId(params.actividadId);
  const letter = vowel.toUpperCase();
  const { outcome } = usePracticeSession();
  const audioUri = outcome?.vowel === vowel ? outcome.attempt.audioUri : null;
  // Sin resultado (por ejemplo, al abrir «Listo» directo) no se dice nada.
  const noVoiceText = outcome
    ? notRecordedText(outcome.voiceConsentStatus)
    : null;
  const { playModel, playAttempt, attemptPlaying } = useAttemptPlayback(
    vowel,
    audioUri,
  );

  const name = outcome?.studentName;
  const cheer = name ? `¡Muy bien, ${name}!` : '¡Muy bien!';
  // Solo si llegó al docente se habla de la profe (en práctica libre no
  // recibe nada). Sin envío no hay «Tu profe…».
  const delivery = outcome?.vowel === vowel ? outcome.delivery : 'review';
  const reviewText =
    delivery !== 'review'
      ? PRACTICE_TEXT
      : audioUri
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
              // Otra vez la misma tarea (si venía de una) o práctica libre.
              router.replace({
                pathname: '/student/speak/[vowel]/say',
                params: activityId
                  ? { vowel, actividadId: activityId }
                  : { vowel },
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
        {delivery === 'notSent' ? (
          <AppText variant="support" tone="secundario">
            {NOT_SENT_ADULT_TEXT}
          </AppText>
        ) : null}
        {noVoiceText ? (
          <AppText variant="support" tone="secundario">
            {noVoiceText}
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
