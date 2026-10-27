import { useRef, useState } from 'react';
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
  FilterChip,
  IconButton,
  Logo,
  Notice,
  Screen,
  TextField,
} from '@/components/ui';
import { MOCK_PASSWORD, mockAccounts } from '@/data/mock/fixtures';
import type { UserRole } from '@/data/types';
import { roleHomes } from '@/features/auth/roleHome';
import { useSignIn, type SignInProblem } from '@/features/auth/useSignIn';
import { spacing } from '@/theme';

const problemNotices: Record<SignInProblem, { title: string; message: string }> =
  {
    invalid: {
      title: 'No pudimos entrar',
      message:
        'El correo o la contraseña no coinciden. Revísalos e inténtalo otra vez.',
    },
    connection: {
      title: 'Sin conexión',
      message: 'Revisa la conexión a internet e inténtalo otra vez.',
    },
  };

/** Nombres de los roles en las cuentas de prueba. */
const roleLabels: Record<UserRole, string> = {
  student: 'Estudiante',
  teacher: 'Docente',
  guardian: 'Acudiente',
  director: 'Directora',
};

/**
 * Iniciar sesión. Por ahora, simulado: la sesión la resuelve
 * `repositories.auth` (ver `src/data/repositories.ts`), que hoy son datos
 * en memoria y mañana la API NestJS. Después de entrar, cada rol va a su
 * pantalla de inicio.
 */
export default function LoginScreen() {
  const form = useSignIn();
  const [showPassword, setShowPassword] = useState(false);
  const [roleNotReady, setRoleNotReady] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);

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

  const notice = form.problem ? problemNotices[form.problem] : null;

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
                  showPassword ? 'Ocultar la contraseña' : 'Mostrar la contraseña'
                }
                onPress={() => setShowPassword((value) => !value)}
              />
            }
          />

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

        {__DEV__ ? <DevAccounts onPick={form.fill} /> : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

interface DevAccountsProps {
  onPick: (values: { email: string; password: string }) => void;
}

/**
 * Solo en desarrollo: llena el formulario con una cuenta de prueba y lleva
 * al «Modo desarrollo». No aparece en una versión publicada.
 */
function DevAccounts({ onPick }: DevAccountsProps) {
  return (
    <Card tone="warm">
      <AppText variant="bodyStrong">Cuentas de prueba</AppText>
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
      <Button
        label="Ir al modo desarrollo"
        variant="link"
        onPress={() => router.push('/dev')}
      />
    </Card>
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
