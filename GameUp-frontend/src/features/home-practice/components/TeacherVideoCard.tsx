import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Card, IconButton } from '@/components/ui';
import { spacing } from '@/theme';

/**
 * «Mira cómo lo hace la profe». PROVISIONAL: la fundación grabará sus
 * propios videos de gestos (no se copian los del Método Ventura). Mientras
 * tanto, el botón ▶ explica que el video llega pronto.
 */
export function TeacherVideoCard() {
  const [asked, setAsked] = useState(false);
  return (
    <Card tone="deep">
      <View style={styles.body}>
        <View style={styles.play}>
          <IconButton
            icon="play"
            variant="accent"
            size="lg"
            accessibilityLabel="Ver cómo lo hace la profe"
            onPress={() => setAsked(true)}
          />
        </View>
        <AppText variant="bodyStrong" tone="sobreOscuro">
          Mira cómo lo hace la profe
        </AppText>
        {asked ? (
          <AppText
            variant="support"
            tone="sobreOscuro"
            accessibilityLiveRegion="polite"
          >
            Muy pronto: la profe grabará este video para ustedes.
          </AppText>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.sm,
  },
  play: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
});
