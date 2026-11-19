import { router, useLocalSearchParams, useNavigation } from 'expo-router';
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
import { parseActivityId, PRACTICE_TEXT } from '@/features/games/delivery';
import { notRecordedText } from '@/features/speak/completePractice';
import { exitPractice } from '@/features/speak/components/PracticeHeader';
import { usePracticeSession } from '@/features/speak/PracticeSession';
import { useAttemptPlayback } from '@/features/speak/useAttemptPlayback';
import {
  SPEAK_NOT_SENT_ADULT_TEXT,
  SPEAK_RETRY_FAILED_TEXT,
  SPEAK_RETRY_SENT_TEXT,
  useSpeakDelivery,
} from '@/features/speak/useSpeakDelivery';
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
  // Viene de una tarea de la profe (no de la práctica libre).
  const fromTask = activityId !== null;
  const navigation = useNavigation();
  /**
   * Sale de todo «Habla conmigo» (el stack anidado) y vuelve a la pantalla
   * desde donde se abrió la tarea: el módulo o el Inicio. Si no hay a dónde
   * volver, abre «Tareas de mi profe».
   */
  const backToTasks = () => {
    const parent = navigation.getParent();
    if (parent?.canGoBack()) parent.goBack();
    else router.navigate('/student/tasks');
  };
  const onClose = fromTask ? backToTasks : exitPractice;
  const letter = vowel.toUpperCase();
  const { outcome } = usePracticeSession();
  // La voz se borra del teléfono al salir de «Listo»; si no llegó a la
  // profe, el adulto puede reintentar el envío.
  const { audioUri, delivery, retry, retrySend } = useSpeakDelivery(
    outcome,
    vowel,
    activityId,
  );
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
              accessibilityLabel={
                fromTask
                  ? 'Cerrar y volver a mis tareas'
                  : 'Salir de la práctica'
              }
              onPress={onClose}
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
          {fromTask ? (
            <Button
              label="Volver a mis tareas"
              variant="accent"
              size="large"
              accessibilityHint="Vuelve a las tareas de tu profe."
              onPress={backToTasks}
            />
          ) : null}
          <Button
            label="Otro sonido"
            variant={fromTask ? 'secondary' : 'accent'}
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
        <View accessibilityLiveRegion="polite">
          {delivery === 'notSent' ? (
            <View style={styles.adult}>
              <AppText variant="support" tone="secundario">
                {retry === 'failed'
                  ? SPEAK_RETRY_FAILED_TEXT
                  : SPEAK_NOT_SENT_ADULT_TEXT}
              </AppText>
              <Button
                label="Reintentar envío"
                icon="replay"
                variant="secondary"
                loading={retry === 'sending'}
                accessibilityHint="Vuelve a enviar la voz a la profe."
                onPress={() => {
                  retrySend().catch(() => {});
                }}
              />
            </View>
          ) : null}
          {retry === 'sent' ? (
            <AppText variant="support" tone="secundario">
              {SPEAK_RETRY_SENT_TEXT}
            </AppText>
          ) : null}
        </View>
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
  adult: {
    gap: spacing.sm,
  },
});
