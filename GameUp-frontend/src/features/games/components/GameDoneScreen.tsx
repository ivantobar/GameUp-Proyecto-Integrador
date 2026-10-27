import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  HeaderCloseButton,
  Icon,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import { Celebration, Character, NarrationButton } from '@/components/gameup';
import { colors, sizes, spacing } from '@/theme';

const CHEER = '¡Lo lograste!';

interface GameDoneScreenProps {
  /** Qué hizo el niño, en una frase: «Ordenaste 2 rutinas». */
  message: string;
  /** Pantalla del juego, para «Jugar otra vez». */
  replayHref: Href;
}

/**
 * Cierre de Emparejar, Clasificar, Secuenciar y Memoria (mismo estilo que
 * «Busca la boca»). Siempre celebra el intento y no muestra puntaje.
 *
 * PENDIENTE (backend): estos juegos todavía no envían su resultado al
 * docente; por eso aquí no se dice «Tu profe va a revisar tu juego».
 */
export function GameDoneScreen({ message, replayHref }: GameDoneScreenProps) {
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
          right={<NarrationButton text={`${CHEER} ${message}.`} />}
        />
      }
      footer={
        <>
          <Button
            label="Jugar otra vez"
            variant="accent"
            size="large"
            onPress={() => router.replace(replayHref)}
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
});
