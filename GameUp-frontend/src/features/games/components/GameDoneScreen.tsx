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
import { CelebrationHero, NarrationButton } from '@/components/gameup';
import { colors, spacing } from '@/theme';
import {
  NOT_SENT_ADULT_TEXT,
  parseActivityId,
  parseDelivery,
  PRACTICE_TEXT,
  REVIEW_TEXT,
} from '../delivery';

const CHEER = '¡Lo lograste!';

interface GameDoneScreenProps {
  /** Qué hizo el niño, en una frase: «Ordenaste 2 rutinas». */
  message: string;
  /** Pantalla del juego, para «Jugar otra vez». */
  replayPath:
    | '/student/match'
    | '/student/classify'
    | '/student/sequence'
    | '/student/memory';
}

/**
 * Cierre de Emparejar, Clasificar, Secuenciar y Memoria (mismo estilo que
 * «Busca la boca»). Siempre celebra el intento y no muestra puntaje. Dice
 * «Tu profe va a revisar…» solo si el resultado llegó al docente (`envio`
 * en la ruta); si no se pudo enviar, deja un aviso para el adulto.
 */
export function GameDoneScreen({ message, replayPath }: GameDoneScreenProps) {
  const params = useLocalSearchParams<{
    envio?: string;
    actividadId?: string;
    escalera?: string;
  }>();
  const delivery = parseDelivery(params.envio);
  const activityId = parseActivityId(params.actividadId);
  const reviewText = delivery === 'review' ? REVIEW_TEXT : PRACTICE_TEXT;

  return (
    <Screen
      tone="brand"
      // El personaje, las estrellas y el aviso, centrados en el espacio
      // libre (sin hueco grande antes de los botones).
      centerContent
      header={
        <ScreenHeader
          left={
            <HeaderCloseButton
              accessibilityLabel="Salir del juego"
              onPress={() => router.back()}
            />
          }
          right={
            <NarrationButton text={`${CHEER} ${message}. ${reviewText}.`} />
          }
        />
      }
      footer={
        <>
          <Button
            label="Jugar otra vez"
            variant="accent"
            size="large"
            // Otra vez la misma tarea (si venía de una), su nivel actual de
            // la escalera (puede haber subido) o el juego libre.
            onPress={() =>
              router.replace(
                params.escalera === '1'
                  ? { pathname: replayPath, params: { escalera: '1' } }
                  : activityId
                    ? {
                        pathname: replayPath,
                        params: { actividadId: activityId },
                      }
                    : replayPath,
              )
            }
          />
          <Button
            label="Terminar"
            variant="secondary"
            size="large"
            onPress={() => router.back()}
          />
        </>
      }
    >
      <CelebrationHero
        cheer={CHEER}
        message={message}
        starsLabel="Tres estrellas por jugar"
      />

      <Card>
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
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  review: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
