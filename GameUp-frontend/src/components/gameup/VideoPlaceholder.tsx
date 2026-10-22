import { StyleSheet, View } from 'react-native';
import { AppText, Badge, Icon } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

interface VideoPlaceholderProps {
  /** Texto que describe el video que irá aquí. */
  description: string;
}

/**
 * Lugar del video del gesto. PROVISIONAL: la terapeuta de la fundación
 * grabará los videos (pantalla del docente, Fase 5) y no se copian los del
 * Método Ventura. Mientras tanto, se muestra este aviso.
 */
export function VideoPlaceholder({ description }: VideoPlaceholderProps) {
  return (
    <View
      style={styles.box}
      accessible
      accessibilityLabel={`${description}. Próximamente.`}
    >
      <Icon name="hand" size="xl" color={colors.texto.sobreOscuro} />
      <AppText tone="sobreOscuro" style={styles.text}>
        {description}
      </AppText>
      <Badge label="Próximamente" tone="brand" />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.verde.profundo,
  },
  text: {
    textAlign: 'center',
  },
});
