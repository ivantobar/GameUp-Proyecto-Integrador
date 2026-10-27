import { router } from 'expo-router';
import { View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  HeaderBackButton,
  Screen,
  ScreenHeader,
  StateView,
} from '@/components/ui';
import { env } from '@/config/env';
import { useHealthCheck } from '@/features/dev/useHealthCheck';

/** Ruta de desarrollo: comprueba que la app llega al backend NestJS. */
export default function ConnectionScreen() {
  const { state, run } = useHealthCheck();

  return (
    <Screen
      header={
        <ScreenHeader
          left={<HeaderBackButton onPress={() => router.back()} />}
          title="Prueba de conexión"
        />
      }
      footer={
        <Button
          label="Probar conexión"
          onPress={run}
          loading={state.kind === 'loading'}
        />
      }
    >
      <AppText tone="secundario">API: {env.apiUrl || 'sin configurar'}</AppText>

      {state.kind === 'idle' ? (
        <AppText>Toca «Probar conexión» con el backend encendido.</AppText>
      ) : null}

      {state.kind === 'loading' ? (
        <StateView kind="loading" title="Consultando el backend…" />
      ) : null}

      {state.kind === 'ok' ? (
        <Card tone="soft">
          <AppText variant="subtitle" accessibilityRole="header">
            Backend conectado
          </AppText>
          <View accessibilityLiveRegion="polite">
            <AppText>Base de datos: {state.data.database}</AppText>
            <AppText>Supabase: {state.data.supabase}</AppText>
          </View>
        </Card>
      ) : null}

      {state.kind === 'error' ? (
        <StateView
          kind="error"
          title="No se pudo conectar"
          message={state.message}
        />
      ) : null}
    </Screen>
  );
}
