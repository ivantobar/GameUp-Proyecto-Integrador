import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  HeaderBackButton,
  Icon,
  Notice,
  Screen,
  ScreenHeader,
  StateView,
} from '@/components/ui';
import { NarrationButton } from '@/components/gameup';
import { ModuleProgressCard } from '@/features/progress/components/ModuleProgressCard';
import { useProgressOverview } from '@/features/progress/useProgressOverview';
import { colors, spacing } from '@/theme';

/**
 * Pestaña «Mi progreso» (según la imagen de referencia del equipo).
 * Cada tema muestra el porcentaje de actividades validadas por el docente.
 */
export default function ProgressScreen() {
  const { resource, reload } = useProgressOverview();

  const narration =
    resource.status === 'ready'
      ? [
          'Este es tu progreso.',
          ...resource.data.modules.map(
            ({ module, percent }) => `${module.title}, ${percent} por ciento.`,
          ),
        ].join(' ')
      : 'Aquí ves tu progreso.';

  return (
    <Screen
      safeAreaBottom={false}
      header={
        <ScreenHeader
          left={
            <HeaderBackButton onPress={() => router.navigate('/student')} />
          }
          right={<NarrationButton text={narration} />}
        />
      }
    >
      <View style={styles.heading}>
        <Icon name="star" size="lg" color={colors.marca.naranja} />
        <AppText variant="title" accessibilityRole="header">
          Mi progreso
        </AppText>
      </View>

      {resource.status === 'loading' ? (
        <StateView kind="loading" title="Mirando tu progreso…" />
      ) : null}
      {resource.status === 'error' ? (
        <StateView
          kind="error"
          title="Vamos a intentarlo otra vez"
          action={{ label: 'Intentar de nuevo', onPress: reload }}
        />
      ) : null}

      {resource.status === 'ready' ? (
        <>
          <View style={styles.list}>
            {resource.data.modules.map(({ module, percent }) => (
              <ModuleProgressCard
                key={module.id}
                module={module}
                percent={percent}
              />
            ))}
          </View>
          <AppText variant="support" tone="secundario">
            Cuenta lo que tu profe ya revisó.
          </AppText>
          {resource.data.pendingValidation > 0 ? (
            <Notice
              icon="time"
              message={
                resource.data.pendingValidation === 1
                  ? 'Tu profe va a revisar 1 actividad antes de sumarla.'
                  : `Tu profe va a revisar ${resource.data.pendingValidation} actividades antes de sumarlas.`
              }
            />
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  list: {
    gap: spacing.sm,
  },
});
