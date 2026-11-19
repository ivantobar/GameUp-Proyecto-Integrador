import { StyleSheet, View } from 'react-native';
import { AppText, Icon, PressableCard, type IconName } from '@/components/ui';
import { colors, radii, sizes, spacing } from '@/theme';

interface HomeShortcutProps {
  icon: IconName;
  title: string;
  subtitle: string;
  accessibilityHint?: string;
  onPress: () => void;
}

/**
 * Acceso pequeño del Inicio (Juegos, Mi progreso): una fila con ícono,
 * texto y flecha. Así el Inicio no se parece a la pantalla Juegos, que usa
 * tarjetas grandes.
 */
export function HomeShortcut({
  icon,
  title,
  subtitle,
  accessibilityHint,
  onPress,
}: HomeShortcutProps) {
  return (
    <PressableCard
      onPress={onPress}
      accessibilityLabel={`${title}. ${subtitle}`}
      accessibilityHint={accessibilityHint}
    >
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <Icon name={icon} size="lg" color={colors.verde.oscuro} />
        </View>
        <View style={styles.texts}>
          <AppText variant="subtitle">{title}</AppText>
          <AppText variant="support" tone="secundario">
            {subtitle}
          </AppText>
        </View>
        <Icon name="forward" color={colors.texto.secundario} />
      </View>
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  /** Mismo recuadro que las tarjetas de tareas (TaskCard). */
  iconBox: {
    width: sizes.iconBox,
    height: sizes.iconBox,
    borderRadius: radii.lg,
    backgroundColor: colors.verde.suave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
  },
});
