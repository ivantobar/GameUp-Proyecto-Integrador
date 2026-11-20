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
import { VOWELS } from '@/data/types';
import {
  NOT_SENT_ADULT_TEXT,
  parseActivityId,
  parseDelivery,
  PRACTICE_TEXT,
} from '@/features/games/delivery';
import { colors, spacing } from '@/theme';

const CHEER = '¡Lo lograste!';
const REVIEW = 'Tu profe va a revisar tu juego antes de sumarlo a tu progreso';

/** Cuántas vocales jugó (las de la actividad, o las cinco). */
function parseCount(value: unknown): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= VOWELS.length
    ? n
    : VOWELS.length;
}

/**
 * Cierre de «Busca la boca» (sin mockup: sigue el estilo de «Listo»).
 * Siempre celebra el intento. No muestra puntaje al niño: el resultado
 * (cuántos acertó al primer intento) es información para el docente.
 */
export default function FindMouthDone() {
  const params = useLocalSearchParams<{
    envio?: string;
    actividadId?: string;
    vocales?: string;
  }>();
  const delivery = parseDelivery(params.envio);
  const activityId = parseActivityId(params.actividadId);
  const count = parseCount(params.vocales);
  // Solo si llegó al docente se habla de la profe (en juego libre no recibe nada).
  const message = delivery === 'review' ? REVIEW : PRACTICE_TEXT;

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
          right={<NarrationButton text={`${CHEER} ${message}.`} />}
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
                      pathname: '/student/find-mouth',
                      params: { actividadId: activityId },
                    }
                  : '/student/find-mouth',
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
        message={
          count === 1
            ? 'Escuchaste la vocal'
            : `Escuchaste las ${count} vocales`
        }
        starsLabel="Tres estrellas por jugar"
      />

      <Card>
        <View style={styles.review}>
          <Icon name="time" color={colors.texto.secundario} />
          <AppText variant="support" tone="secundario" style={styles.flex}>
            {message}
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
