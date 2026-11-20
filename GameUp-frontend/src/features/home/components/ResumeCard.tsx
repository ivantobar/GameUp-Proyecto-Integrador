import { StyleSheet, View } from 'react-native';
import { AppText, Button, Card } from '@/components/ui';
import { Character } from '@/components/gameup';
import { EnterStagger } from '@/components/gameup/motion';
import { useLargeText } from '@/features/accessibility/useLargeText';
import { radii, sizes, spacing } from '@/theme';
import type { Vowel } from '@/data/types';

interface ResumeCardProps {
  gameTitle: string;
  vowel: Vowel;
  onContinue: () => void;
}

/**
 * «Sigue donde ibas»: un solo botón grande para continuar. Mismo diseño que
 * el aviso de la tarea («Haz esta tarea»). El botón es naranja porque está
 * sobre verde oscuro (excepción aprobada).
 */
export function ResumeCard({ gameTitle, vowel, onContinue }: ResumeCardProps) {
  const largeText = useLargeText();
  const sound = `Sonido ${vowel.toUpperCase()}`;
  return (
    <EnterStagger index={0}>
      <Card tone="brand" style={styles.card}>
        <View style={largeText ? styles.stacked : styles.row}>
          <Character mouth={vowel} size="md" />
          <View style={largeText ? styles.stackedTexts : styles.texts}>
            <AppText variant="label" tone="sobreOscuro">
              Sigue donde ibas
            </AppText>
            <AppText variant="title" tone="sobreOscuro">
              {gameTitle}
            </AppText>
            <AppText tone="sobreOscuro">{sound}</AppText>
          </View>
        </View>
        <Button
          label="Continuar"
          variant="accent"
          size="large"
          accessibilityHint={`Sigue con ${gameTitle}, ${sound}`}
          onPress={onContinue}
        />
      </Card>
    </EnterStagger>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  /** Letra grande: el dibujo arriba y el texto debajo, a todo el ancho. */
  stacked: {
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stackedTexts: {
    alignSelf: 'stretch',
    gap: spacing.xxs,
  },
  /** Si no cabe, el texto baja debajo del personaje (flexWrap). */
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
  },
  texts: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: sizes.textColumnMin,
    gap: spacing.xxs,
  },
});
