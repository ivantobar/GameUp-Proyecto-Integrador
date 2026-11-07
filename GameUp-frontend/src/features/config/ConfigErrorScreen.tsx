import { StyleSheet, View } from 'react-native';
import { Logo, Screen, StateView } from '@/components/ui';
import { spacing } from '@/theme';

/**
 * Se muestra en lugar de toda la app cuando una versión publicada quedó mal
 * configurada (sin URL de la API o sin `https://`). No deja iniciar sesión.
 *
 * Solo lleva el mensaje para la familia: ni la URL ni detalles técnicos.
 */
export function ConfigErrorScreen() {
  return (
    <Screen scroll={false}>
      <View style={styles.content}>
        <Logo />
        <StateView
          kind="error"
          title="GameUP no está bien configurado"
          message="Avísale a la fundación."
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
});
