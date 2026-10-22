import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

export type StateKind = 'loading' | 'empty' | 'error';

const stateIcons: Record<Exclude<StateKind, 'loading'>, IconName> = {
  empty: 'empty',
  error: 'offline',
};

interface StateViewProps {
  kind: StateKind;
  /**
   * Mensaje corto y amable. En pantallas del niño no se habla de «error» ni
   * de «fallo»: por ejemplo, «Vamos a intentarlo otra vez».
   */
  title: string;
  message?: string;
  action?: { label: string; onPress: () => void };
}

/** Estados de carga, vacío y error, con el mismo aspecto en toda la app. */
export function StateView({ kind, title, message, action }: StateViewProps) {
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      {kind === 'loading' ? (
        <ActivityIndicator
          style={styles.visual}
          size="large"
          color={colors.verde.oscuro}
          accessibilityLabel={title}
        />
      ) : (
        <View style={styles.visual}>
          <Icon name={stateIcons[kind]} size="xl" color={colors.verde.oscuro} />
        </View>
      )}
      <AppText variant="subtitle" style={styles.center}>
        {title}
      </AppText>
      {message ? (
        <AppText tone="secundario" style={styles.center}>
          {message}
        </AppText>
      ) : null}
      {action ? (
        <Button
          label={action.label}
          onPress={action.onPress}
          variant="secondary"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  center: {
    textAlign: 'center',
  },
  visual: {
    alignSelf: 'center',
  },
});
