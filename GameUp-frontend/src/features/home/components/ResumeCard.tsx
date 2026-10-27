import { StyleSheet, View } from 'react-native';
import { AppText, Button, Card } from '@/components/ui';
import { Character } from '@/components/gameup';
import { spacing } from '@/theme';
import type { Vowel } from '@/data/types';

interface ResumeCardProps {
  gameTitle: string;
  vowel: Vowel;
  onContinue: () => void;
}

/**
 * «Sigue donde ibas»: un solo botón grande para continuar.
 * El botón es naranja porque está sobre verde oscuro (excepción aprobada).
 */
export function ResumeCard({ gameTitle, vowel, onContinue }: ResumeCardProps) {
  const sound = `Sonido ${vowel.toUpperCase()}`;
  return (
    <Card tone="brand">
      <View style={styles.row}>
        <View style={styles.texts}>
          <AppText variant="label" tone="sobreOscuro">
            Sigue donde ibas
          </AppText>
          <AppText variant="title" tone="sobreOscuro">
            {gameTitle}
          </AppText>
          <AppText tone="sobreOscuro">{sound}</AppText>
        </View>
        <Character mouth={vowel} size="md" />
      </View>
      <Button
        label="Continuar"
        variant="accent"
        size="large"
        accessibilityHint={`Sigue con ${gameTitle}, ${sound}`}
        onPress={onContinue}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  texts: {
    flex: 1,
    gap: spacing.xxs,
  },
});
