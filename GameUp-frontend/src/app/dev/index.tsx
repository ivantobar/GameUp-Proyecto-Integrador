import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Badge,
  Button,
  Card,
  FilterChip,
  Icon,
  Notice,
  PressableCard,
  Screen,
  ScreenHeader,
  type IconName,
} from '@/components/ui';
import { useDevSettings } from '@/data/mock/devSettings';
import { colors, spacing } from '@/theme';

interface RoleEntry {
  label: string;
  icon: IconName;
  /** Fase del plan en la que se construye el flujo de este rol. */
  phase: string;
  /** Ruta de entrada, cuando el flujo ya existe. */
  href?: Href;
}

/** Roles con mockup. La directora no tiene mockup y no se diseña todavía. */
const roles: readonly RoleEntry[] = [
  { label: 'Estudiante', icon: 'student', phase: 'Fase 2', href: '/student' },
  { label: 'Docente', icon: 'teacher', phase: 'Fase 5' },
  { label: 'Acudiente', icon: 'guardian', phase: 'Fase 5' },
];

/**
 * Selector temporal, solo para desarrollo. Permite revisar cada flujo sin
 * inicio de sesión. No es una pantalla de la app ni reemplaza los permisos,
 * que se verificarán en el backend.
 */
export default function DevHome() {
  const { settings, update } = useDevSettings();
  return (
    <Screen header={<ScreenHeader title="Modo desarrollo" />}>
      <Notice
        icon="info"
        tone="warm"
        title="Pantalla temporal"
        message="Solo existe en desarrollo para revisar los flujos. No es el inicio de sesión."
      />

      <View style={styles.section}>
        <AppText variant="label" tone="secundario" accessibilityRole="header">
          Herramientas
        </AppText>
        <Button
          label="Catálogo de componentes"
          icon="palette"
          variant="secondary"
          onPress={() => router.push('/dev/catalog')}
        />
        <Button
          label="Prueba de conexión"
          icon="connection"
          variant="secondary"
          onPress={() => router.push('/dev/connection')}
        />
      </View>

      <View style={styles.section}>
        <AppText variant="label" tone="secundario" accessibilityRole="header">
          Datos simulados
        </AppText>
        <Card>
          <AppText variant="bodyStrong">
            ¿El acudiente autorizó grabar la voz?
          </AppText>
          <AppText variant="support" tone="secundario">
            Sin autorización, «Dilo» no graba y muestra «Ya lo dije».
          </AppText>
          <View style={styles.chips}>
            <FilterChip
              label="Sí, autorizó"
              selected={settings.voiceConsent}
              onPress={() => update({ voiceConsent: true })}
            />
            <FilterChip
              label="No autorizó"
              selected={!settings.voiceConsent}
              onPress={() => update({ voiceConsent: false })}
            />
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <AppText variant="label" tone="secundario" accessibilityRole="header">
          Ver la app como
        </AppText>
        {roles.map(({ label, icon, phase, href }) =>
          href ? (
            <PressableCard
              key={label}
              accessibilityLabel={`Entrar como ${label}`}
              onPress={() => router.push(href)}
            >
              <View style={styles.roleRow}>
                <Icon name={icon} color={colors.verde.oscuro} />
                <AppText variant="bodyStrong" style={styles.roleName}>
                  {label}
                </AppText>
                <Icon name="forward" color={colors.verde.oscuro} />
              </View>
            </PressableCard>
          ) : (
            <Card key={label}>
              <View
                style={styles.roleRow}
                accessible
                accessibilityLabel={`${label}. Se construye en la ${phase}.`}
              >
                <Icon name={icon} color={colors.verde.oscuro} />
                <AppText variant="bodyStrong" style={styles.roleName}>
                  {label}
                </AppText>
                <Badge label={phase} tone="neutral" />
              </View>
            </Card>
          ),
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  roleName: {
    flex: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
