import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Card,
  Icon,
  Screen,
  ScreenHeader,
  StateView,
  type IconName,
} from '@/components/ui';
import { useScreenRefresh } from '@/features/refresh/useScreenRefresh';
import { SignOutButton } from '@/features/auth/components/SignOutButton';
import { colors, radii, sizes, spacing } from '@/theme';
import { useLargeText } from '@/features/accessibility/useLargeText';
import {
  useDirectorOverview,
  type DirectorOverview,
} from '../useDirectorOverview';
import { errorOf, LoadErrorState } from '@/features/errors/LoadErrorState';

interface Figure {
  key: keyof DirectorOverview;
  label: string;
  icon: IconName;
}

const figures: readonly Figure[] = [
  { key: 'students', label: 'Estudiantes', icon: 'student' },
  { key: 'pendingReviews', label: 'Por validar', icon: 'ear' },
  { key: 'inProgress', label: 'Asignaciones en curso', icon: 'time' },
  { key: 'assigned', label: 'Asignaciones sin empezar', icon: 'note' },
  { key: 'completed', label: 'Asignaciones completadas', icon: 'check' },
];

/** Directora · «Resumen»: cifras generales de la fundación. */
export function OverviewView() {
  const { resource, reload, refresh, refreshing, refreshFailed } =
    useDirectorOverview();
  const screenRefresh = useScreenRefresh({
    refresh,
    refreshing,
    refreshFailed,
  });
  const largeText = useLargeText();

  return (
    <Screen
      refresh={screenRefresh}
      safeAreaBottom={false}
      header={
        <ScreenHeader
          title="Resumen"
          right={<SignOutButton />}
          refresh={screenRefresh}
        />
      }
    >
      {resource.status === 'loading' ? (
        <StateView kind="loading" title="Contando…" />
      ) : null}
      {resource.status === 'error' ? (
        <LoadErrorState
          error={errorOf(resource)}
          title="No pudimos cargar el resumen"
          message="Revisa la conexión."
          action={{ label: 'Intentar de nuevo', onPress: reload }}
        />
      ) : null}
      {resource.status === 'ready' ? (
        <View style={styles.list}>
          <AppText variant="support" tone="secundario">
            Cifras de toda la fundación.
          </AppText>
          {rowsOf(figures, largeText).map((row) => (
            <View key={row.map((f) => f.key).join('-')} style={styles.row}>
              {row.map((figure) => (
                <FigureCard
                  key={figure.key}
                  figure={figure}
                  value={resource.data[figure.key]}
                />
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

/**
 * Estudiantes a todo el ancho y las demás cifras de dos en dos; con letra
 * grande, todas de a una (los números grandes no caben de a dos).
 */
function rowsOf(items: readonly Figure[], largeText: boolean): Figure[][] {
  if (largeText) return items.map((item) => [item]);
  const [first, ...rest] = items;
  const rows: Figure[][] = first ? [[first]] : [];
  for (let i = 0; i < rest.length; i += 2) rows.push(rest.slice(i, i + 2));
  return rows;
}

/** Una cifra: ícono, número grande y qué es. */
function FigureCard({
  figure,
  value,
}: {
  figure: Figure;
  value: number | null;
}) {
  const text = value === null ? 'No disponible' : String(value);
  return (
    <Card style={styles.card}>
      <View
        style={styles.figure}
        accessible
        accessibilityLabel={`${figure.label}: ${text}`}
        testID={`resumen-${figure.key}`}
      >
        <View style={styles.iconBox}>
          <Icon name={figure.icon} color={colors.verde.oscuro} />
        </View>
        <AppText
          variant={value === null ? 'support' : 'number'}
          tone={value === null ? 'secundario' : 'principal'}
        >
          {text}
        </AppText>
        <AppText variant="support" tone="secundario">
          {figure.label}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    flex: 1,
  },
  figure: {
    gap: spacing.xxs,
  },
  iconBox: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizes.touchMin,
    height: sizes.touchMin,
    borderRadius: radii.md,
    backgroundColor: colors.verde.suave,
    marginBottom: spacing.xs,
  },
});
