import { router } from 'expo-router';
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
import { VOWELS } from '@/data/types';
import { colors, sizes, spacing } from '@/theme';

const CHEER = '¡Lo lograste!';
const REVIEW = 'Tu profe va a revisar tu juego antes de sumarlo a tu progreso';

/**
 * Cierre de «Busca la boca» (sin mockup: sigue el estilo de «Listo»).
 * Siempre celebra el intento. No muestra puntaje al niño: el resultado
 * (cuántos acertó al primer intento) es información para el docente.
 */
export default function FindMouthDone() {
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
          right={<NarrationButton text={`${CHEER} ${REVIEW}.`} />}
        />
      }
      footer={
        <>
          <Button
            label="Jugar otra vez"
            variant="accent"
            size="large"
            onPress={() => router.replace('/student/find-mouth')}
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
          Escuchaste las {VOWELS.length} vocales
        </AppText>
      </View>

      <Card>
        <View style={styles.review}>
          <Icon name="time" color={colors.texto.secundario} />
          <AppText variant="support" tone="secundario" style={styles.flex}>
            {REVIEW}
          </AppText>
        </View>
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
