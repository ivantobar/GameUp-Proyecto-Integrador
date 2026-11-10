import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureVideo } from '@/components/gameup';
import { AppText, Card, IconButton } from '@/components/ui';
import type { Vowel } from '@/data/types';
import { spacing } from '@/theme';

interface TeacherVideoCardProps {
  /** Sonido de la semana: se muestra el video de su gesto. */
  vowel: Vowel;
}

/**
 * «Mira cómo lo hace la profe». Al tocar ▶ aparece el video del gesto,
 * grabado por doña Consuelo, terapeuta de la fundación, cuyo método se basa
 * en el Método Ventura de Patricia Ventura.
 */
export function TeacherVideoCard({ vowel }: TeacherVideoCardProps) {
  const [open, setOpen] = useState(false);
  return (
    <Card tone="deep">
      <View style={styles.body}>
        {open ? (
          <GestureVideo vowel={vowel} />
        ) : (
          <View style={styles.play}>
            <IconButton
              icon="play"
              variant="accent"
              size="lg"
              accessibilityLabel="Ver cómo lo hace la profe"
              onPress={() => setOpen(true)}
            />
          </View>
        )}
        <AppText variant="bodyStrong" tone="sobreOscuro">
          Mira cómo lo hace la profe
        </AppText>
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
