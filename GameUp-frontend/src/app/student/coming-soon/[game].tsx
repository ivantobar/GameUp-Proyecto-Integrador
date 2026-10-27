import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  HeaderBackButton,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import { Character } from '@/components/gameup';
import { spacing } from '@/theme';
import { gameCatalog } from '@/features/games/catalog';

/**
 * Juego en construcción. Mensaje amable para el niño: no dice «error» ni
 * «no disponible»; lo invita a volver.
 */
export default function ComingSoonScreen() {
  const params = useLocalSearchParams<{ game: string }>();
  const game = gameCatalog.find((item) => item.id === params.game);
  const title = game?.title ?? 'Este juego';

  return (
    <Screen
      header={
        <ScreenHeader
          left={<HeaderBackButton onPress={() => router.back()} />}
          title={title}
        />
      }
      footer={
        <Button
          label="Volver a los juegos"
          size="large"
          onPress={() => router.back()}
        />
      }
    >
      <View style={styles.center}>
        <Character mouth="smile" size="lg" />
        <AppText variant="title" style={styles.text}>
          Estamos preparando {title}
        </AppText>
        <AppText tone="secundario" style={styles.text}>
          Muy pronto podrás jugarlo.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    gap: spacing.md,
  },
  text: {
    textAlign: 'center',
  },
});
