import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { sizes, spacing } from '@/theme';
import { AppText } from './AppText';
import { IconButton } from './IconButton';
import type { ScreenRefresh } from './types';

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
  /**
   * Botón «Actualizar» (solo pantallas de adultos). Va en el lado libre:
   * a la izquierda si no hay «Volver»; si no, a la derecha; si los dos
   * lados están ocupados, junto al botón de la derecha.
   */
  refresh?: ScreenRefresh;
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
  refresh,
}: ScreenHeaderProps) {
  const refreshButton = refresh ? <RefreshButton refresh={refresh} /> : null;
  const leftContent = left ?? refreshButton;
  const rightContent =
    !refreshButton || leftContent === refreshButton ? (
      right
    ) : right ? (
      <View style={styles.pair}>
        {refreshButton}
        {right}
      </View>
    ) : (
      refreshButton
    );
  return (
    <View style={styles.row} testID="screen-header">
      <View style={styles.side} testID="screen-header-left">
        {leftContent}
      </View>
      <View style={styles.center} testID="screen-header-center">
        {center ??
          (title ? (
            <AppText
              variant="subtitle"
              tone={onDark ? 'sobreOscuro' : 'principal'}
              accessibilityRole="header"
              // Dos líneas: con letra grande, el título no se corta.
              numberOfLines={2}
              style={styles.title}
            >
              {title}
            </AppText>
          ) : null)}
      </View>
      <View style={[styles.side, styles.right]} testID="screen-header-right">
        {rightContent}
      </View>
    </View>
  );
}

/**
 * «Actualizar»: vuelve a pedir los datos de la pantalla. Mientras recarga
 * queda deshabilitado (una sola petición a la vez) y TalkBack lo dice.
 */
function RefreshButton({ refresh }: { refresh: ScreenRefresh }) {
  return (
    <IconButton
      icon="replay"
      variant="soft"
      accessibilityLabel={refresh.refreshing ? 'Actualizando' : 'Actualizar'}
      accessibilityHint="Vuelve a cargar los datos de esta pantalla"
      disabled={refresh.refreshing}
      onPress={refresh.onRefresh}
      testID="header-refresh"
    />
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
  /** Dos botones en un lado (solo si los dos lados ya están ocupados). */
  pair: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  /**
   * Lo único flexible del encabezado: crece a lo ANCHO (está en una fila).
   * Nada del encabezado crece a lo alto: mide lo que su contenido (ver
   * `layoutSizing.test.tsx`).
   */
  center: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
});
