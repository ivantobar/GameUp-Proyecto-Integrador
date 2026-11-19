import { useRef, useState, type ComponentRef, type ComponentType } from 'react';
import { router } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  type TextInput,
} from 'react-native';
import {
  AppText,
  Button,
  Card,
  IconButton,
  Logo,
  Notice,
  Screen,
  TextField,
} from '@/components/ui';
import { roleHomes } from '@/features/auth/roleHome';
import { useSignIn, type SignInProblem } from '@/features/auth/useSignIn';
import type { DevAccountsProps } from '@/features/dev/DevAccounts';
import { spacing } from '@/theme';

const problemNotices: Record<
  SignInProblem,
  { title: string; message: string }
> = {
  invalid: {
    title: 'No pudimos entrar',
    message:
      'El correo o la contraseña no coinciden. Revísalos e inténtalo otra vez.',
  },
  notAllowed: {
    title: 'No pudimos entrar',
    message: 'Tu cuenta no tiene acceso a GameUP. Habla con la fundación.',
  },
  unavailable: {
    title: 'GameUP no está disponible',
    message:
      'No pudimos verificar tu cuenta en este momento. Espera un momento e inténtalo otra vez.',
  },
  tooMany: {
    title: 'Demasiados intentos',
    message: 'Demasiados intentos. Espera un momento y vuelve a intentarlo.',
  },
  connection: {
    title: 'Sin conexión',
    message: 'Revisa la conexión a internet e inténtalo otra vez.',
  },
};

/**
 * «Cuentas de prueba», solo en desarrollo. En una versión publicada
 * `__DEV__` es `false` y el `require` desaparece del paquete: ni el bloque
 * ni la contraseña de prueba entran en la APK.
 */
const DevAccounts: ComponentType<DevAccountsProps> | null = __DEV__
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@/features/dev/DevAccounts').DevAccounts
  : null;

/**
 * Iniciar sesión. La sesión la resuelve `repositories.auth` (ver
 * `src/data/repositories.ts`): datos simulados o la API NestJS, según
 * `EXPO_PUBLIC_DATA_SOURCE`. Después de entrar, cada rol va a su pantalla
 * de inicio.
 */
export default function LoginScreen() {
  const form = useSignIn();
  const [showPassword, setShowPassword] = useState(false);
  const [roleNotReady, setRoleNotReady] = useState<string | null>(null);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const onSubmit = async () => {
    setRoleNotReady(null);
    const session = await form.submit();
    if (!session) return;
    const home = roleHomes[session.role];
    if (home) {
      router.replace(home);
    } else {
      setRoleNotReady(session.displayName);
    }
  };

  const baseNotice = form.problem ? problemNotices[form.problem] : null;
  // Si el backend explicó por qué la cuenta no puede entrar (inactiva, rol
  // distinto, no está en ASISCO UP...), se muestra ese motivo.
  const notice =
    baseNotice && form.problem === 'notAllowed' && form.reason
      ? { ...baseNotice, message: form.reason }
      : baseNotice;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <View style={styles.brand}>
          <Logo />
          <View style={styles.texts}>
            <AppText
              variant="title"
              accessibilityRole="header"
              style={styles.center}
            >
              Te damos la bienvenida a GameUP
            </AppText>
            <AppText tone="secundario" style={styles.center}>
              Escribe tu correo y tu contraseña.
            </AppText>
          </View>
        </View>

        <Card>
          <View style={styles.form}>
            <TextField
              label="Correo"
              value={form.email}
              onChangeText={form.setEmail}
              placeholder="nombre@correo.com"
              error={form.errors.email}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordRef.current?.focus()}
              editable={!form.submitting}
              testID="login-email"
            />
            <TextField
              inputRef={passwordRef}
              label="Contraseña"
              value={form.password}
              onChangeText={form.setPassword}
              error={form.errors.password}
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              textContentType="password"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={() => {
                onSubmit().catch(() => {});
              }}
              editable={!form.submitting}
              testID="login-password"
              trailing={
                <IconButton
                  icon={showPassword ? 'eyeOff' : 'eye'}
                  variant="soft"
                  size="sm"
                  accessibilityLabel={
                    showPassword
                      ? 'Ocultar la contraseña'
                      : 'Mostrar la contraseña'
                  }
                  onPress={() => setShowPassword((value) => !value)}
                />
              }
            />

            {form.waking ? (
              // El backend gratuito de Render se duerme: el primer «Entrar»
              // del día puede tardar casi un minuto.
              <View accessibilityLiveRegion="polite">
                <Notice
                  icon="time"
                  tone="soft"
                  title="Estamos despertando GameUP…"
                  message="Puede tardar hasta un minuto. No cierres la app."
                />
              </View>
            ) : null}

            {notice ? (
              <View accessibilityLiveRegion="polite">
                <Notice
                  icon={form.problem === 'connection' ? 'offline' : 'info'}
                  tone="warm"
                  title={notice.title}
                  message={notice.message}
                />
              </View>
            ) : null}

            {roleNotReady ? (
              <View accessibilityLiveRegion="polite">
                <Notice
                  icon="construction"
                  tone="soft"
                  title={`Hola, ${roleNotReady}`}
                  message="Tu espacio en GameUP llega en una próxima versión."
                />
              </View>
            ) : null}

            <Button
              label="Entrar"
              icon="login"
              loading={form.submitting}
              onPress={() => {
                onSubmit().catch(() => {});
              }}
            />
          </View>
        </Card>

        {DevAccounts ? <DevAccounts onPick={form.fill} /> : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  brand: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  texts: {
    gap: spacing.xxs,
  },
  center: {
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
  },
});
