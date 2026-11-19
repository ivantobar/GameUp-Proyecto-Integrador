import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Card, FilterChip } from '@/components/ui';
import { env } from '@/config/env';
import { MOCK_PASSWORD, mockAccounts } from '@/data/mock/fixtures';
import type { UserRole } from '@/data/types';
import { spacing } from '@/theme';

/** Nombres de los roles en las cuentas de prueba. */
const roleLabels: Record<UserRole, string> = {
  student: 'Estudiante',
  teacher: 'Docente',
  guardian: 'Acudiente',
  director: 'Directora',
};

export interface DevAccountsProps {
  onPick: (values: { email: string; password: string }) => void;
}

/**
 * Solo en desarrollo: llena el formulario con una cuenta de prueba y lleva
 * al «Modo desarrollo». «Iniciar sesión» lo carga solo con `__DEV__`, así
 * que ni este bloque ni la contraseña de prueba entran en la APK. Con la
 * API, las cuentas ficticias no existen: no se ofrecen.
 */
export function DevAccounts({ onPick }: DevAccountsProps) {
  const usesMockData = env.dataSource === 'mock';
  return (
    <Card tone="warm">
      <AppText variant="bodyStrong">Cuentas de prueba</AppText>
      {usesMockData ? (
        <>
          <AppText variant="support" tone="cafe">
            Solo en desarrollo. Contraseña: {MOCK_PASSWORD}
          </AppText>
          <View style={styles.chips}>
            {Object.entries(mockAccounts).map(([email, session]) => (
              <FilterChip
                key={email}
                label={roleLabels[session.role]}
                selected={false}
                onPress={() => onPick({ email, password: MOCK_PASSWORD })}
              />
            ))}
          </View>
        </>
      ) : (
        <AppText variant="support" tone="cafe">
          La app usa la API. Entra con una cuenta de prueba del backend.
        </AppText>
      )}
      <Button
        label="Ir al modo desarrollo"
        variant="link"
        onPress={() => router.push('/dev')}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
