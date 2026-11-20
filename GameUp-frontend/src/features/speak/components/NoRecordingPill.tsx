import { StyleSheet, View } from 'react-native';
import { AppText, Icon } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

interface NoRecordingPillProps {
  /** «Práctica libre: tu voz no se graba», etc. */
  text: string;
}

/**
 * Aviso corto debajo del espejo de «Dilo» cuando la voz no se graba. Mismo
 * estilo que la píldora «Espejo: mírate, no se graba». TalkBack lo lee (y
 * lo anuncia si aparece después de cargar la autorización).
 */
export function NoRecordingPill({ text }: NoRecordingPillProps) {
  return (
    <View
      style={styles.pill}
      accessible
      accessibilityLabel={text}
      accessibilityLiveRegion="polite"
      testID="no-recording-notice"
    >
      <Icon name="info" size="sm" color={colors.texto.sobreOscuro} />
      <AppText variant="support" tone="sobreOscuro" style={styles.text}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
    backgroundColor: colors.verde.oscuro,
  },
  /** Con letra grande, el texto baja de línea dentro de la píldora. */
  text: {
    flexShrink: 1,
  },
});
