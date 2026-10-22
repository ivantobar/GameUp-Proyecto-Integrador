import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../components/BigButton';
import { env } from '../config/env';
import { getHealth, type HealthResponse } from '../services/health.service';
import { colors, fontSize, spacing } from '../theme/theme';

type CheckState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; data: HealthResponse }
  | { kind: 'error'; message: string };

/**
 * Pantalla inicial temporal. Sirve para comprobar que la app (en Expo Go)
 * llega al backend NestJS. Se reemplazará por el inicio de sesión.
 */
export function HomeScreen() {
  const [check, setCheck] = useState<CheckState>({ kind: 'idle' });

  async function testConnection() {
    setCheck({ kind: 'loading' });
    try {
      const data = await getHealth();
      setCheck({ kind: 'ok', data });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      setCheck({ kind: 'error', message });
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          GameUP
        </Text>
        <Text style={styles.subtitle}>Fundación ASISCO-UP</Text>

        <BigButton
          label="Probar conexión"
          onPress={testConnection}
          loading={check.kind === 'loading'}
        />

        <View style={styles.result} accessibilityLiveRegion="polite">
          {check.kind === 'ok' && (
            <>
              <Text style={[styles.resultText, styles.ok]}>
                Backend conectado
              </Text>
              <Text style={styles.detail}>
                Base de datos: {check.data.database}
              </Text>
              <Text style={styles.detail}>Supabase: {check.data.supabase}</Text>
            </>
          )}
          {check.kind === 'error' && (
            <>
              <Text style={[styles.resultText, styles.warning]}>
                No se pudo conectar
              </Text>
              <Text style={styles.detail}>{check.message}</Text>
            </>
          )}
        </View>

        <Text style={styles.footer}>API: {env.apiUrl || 'sin configurar'}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    marginTop: -spacing.md,
  },
  result: {
    minHeight: 110,
    alignItems: 'center',
    gap: spacing.sm,
  },
  resultText: {
    fontSize: fontSize.body + 2,
    fontWeight: '700',
  },
  ok: {
    color: colors.success,
  },
  warning: {
    color: colors.warning,
  },
  detail: {
    fontSize: fontSize.body - 2,
    color: colors.text,
    textAlign: 'center',
  },
  footer: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
