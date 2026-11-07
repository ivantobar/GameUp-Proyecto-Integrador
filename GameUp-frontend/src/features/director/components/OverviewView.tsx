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
import { useRefreshOnFocus } from '@/data/useRefreshOnFocus';
import { SignOutButton } from '@/features/auth/components/SignOutButton';
import { colors, spacing } from '@/theme';
import {
  useDirectorOverview,
  type DirectorOverview,
} from '../useDirectorOverview';

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
  const { resource, reload, refresh } = useDirectorOverview();
  useRefreshOnFocus(refresh);

  return (
    <Screen
      safeAreaBottom={false}
      header={<ScreenHeader title="Resumen" right={<SignOutButton />} />}
    >
      {resource.status === 'loading' ? (
        <StateView kind="loading" title="Contando…" />
      ) : null}
      {resource.status === 'error' ? (
        <StateView
          kind="error"
          title="No pudimos cargar el resumen"
          message="Revisa la conexión."
          action={{ label: 'Intentar de nuevo', onPress: reload }}
        />
      ) : null}
      {resource.status === 'ready' ? (
        <View style={styles.list}>
          {figures.map((figure) => (
            <FigureCard
              key={figure.key}
              figure={figure}
              value={resource.data[figure.key]}
            />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function FigureCard({
  figure,
  value,
}: {
  figure: Figure;
  value: number | null;
}) {
  const text = value === null ? 'No disponible' : String(value);
  return (
    <Card>
      <View
        style={styles.row}
        accessible
        accessibilityLabel={`${figure.label}: ${text}`}
        testID={`resumen-${figure.key}`}
      >
        <Icon name={figure.icon} color={colors.verde.oscuro} />
        <AppText style={styles.flex}>{figure.label}</AppText>
        <AppText
          variant={value === null ? 'support' : 'title'}
          tone={value === null ? 'secundario' : 'principal'}
        >
          {text}
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
    alignItems: 'center',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
});
