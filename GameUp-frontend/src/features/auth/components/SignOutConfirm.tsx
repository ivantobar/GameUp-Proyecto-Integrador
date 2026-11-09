import { StyleSheet, View } from 'react-native';
import { AppText, Button, Card } from '@/components/ui';
import { spacing } from '@/theme';
import { useSignOut } from '../useSignOut';

interface SignOutConfirmProps {
  onCancel: () => void;
}

/**
 * Confirmación antes de salir de la cuenta del estudiante: en un celular
 * de la familia, el adulto sale; el niño no sale por un toque sin querer.
 */
export function SignOutConfirm({ onCancel }: SignOutConfirmProps) {
  const { signOut, signingOut } = useSignOut();
  return (
    <Card>
      <View style={styles.content} accessibilityLiveRegion="polite">
        <AppText variant="subtitle" accessibilityRole="header">
          ¿Salir de la cuenta?
        </AppText>
        <AppText tone="secundario">Pídele ayuda a un adulto.</AppText>
        <Button
          label="Salir"
          variant="warm"
          loading={signingOut}
          onPress={() => {
            signOut().catch(() => {});
          }}
        />
        <Button
          label="Cancelar"
          variant="secondary"
          disabled={signingOut}
          onPress={onCancel}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
  },
});
