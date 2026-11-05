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
import { Celebration, Character, NarrationButton } from '@/components/gameup';
import { colors, sizes, spacing } from '@/theme';
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
  }>();
  const delivery = parseDelivery(params.envio);
  const activityId = parseActivityId(params.actividadId);
  const reviewText = delivery === 'review' ? REVIEW_TEXT : PRACTICE_TEXT;

  return (
    <Screen
      tone="brand"
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
            // Otra vez la misma tarea (si venía de una) o el juego libre.
            onPress={() =>
              router.replace(
                activityId
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
          accessibilityLabel="Tres estrellas por jugar"
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
          {CHEER}
        </AppText>
        <AppText tone="sobreOscuro" style={styles.text}>
          {message}
        </AppText>
      </View>

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
  center: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  stars: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  text: {
    textAlign: 'center',
  },
  review: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
