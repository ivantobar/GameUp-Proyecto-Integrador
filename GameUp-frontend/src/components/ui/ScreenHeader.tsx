import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { sizes, spacing } from '@/theme';
import { AppText } from './AppText';
import { IconButton } from './IconButton';

interface ScreenHeaderProps {
  /** Botón izquierdo: `HeaderBackButton` o `HeaderCloseButton`. */
  left?: ReactNode;
  /** Título centrado. Si se pasa `center`, se ignora. */
  title?: string;
  /** Contenido central: pasos Mira/Dilo/Listo o puntos de avance. */
  center?: ReactNode;
  /** Botón derecho, normalmente el parlante. */
  right?: ReactNode;
  /** Color del título cuando el fondo es oscuro. */
  onDark?: boolean;
}

/**
 * Encabezado de pantalla con tres zonas. Los lados tienen ancho fijo para
 * que el centro quede realmente centrado aunque falte un botón.
 */
export function ScreenHeader({
  left,
  title,
  center,
  right,
  onDark = false,
}: ScreenHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.side}>{left}</View>
      <View style={styles.center}>
        {center ??
          (title ? (
            <AppText
              variant="subtitle"
              tone={onDark ? 'sobreOscuro' : 'principal'}
              accessibilityRole="header"
              numberOfLines={1}
            >
              {title}
            </AppText>
          ) : null)}
      </View>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

interface HeaderButtonProps {
  onPress: () => void;
  /** Por defecto «Volver» o «Cerrar». */
  accessibilityLabel?: string;
}

/** ‹ Volver a la pantalla anterior. */
export function HeaderBackButton({
  onPress,
  accessibilityLabel = 'Volver',
}: HeaderButtonProps) {
  return (
    <IconButton
      icon="back"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
    />
  );
}

/** ✕ Salir del juego. */
export function HeaderCloseButton({
  onPress,
  accessibilityLabel = 'Cerrar',
}: HeaderButtonProps) {
  return (
    <IconButton
      icon="close"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.iconButton.md,
    gap: spacing.xs,
  },
  side: {
    width: sizes.iconButton.md,
  },
  right: {
    alignItems: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
});
