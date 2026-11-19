import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, type ThemeColor } from '@/theme';
import { Backdrop, type BackdropKind } from './Backdrop';

export type ScreenTone =
  'gray' | 'white' | 'softGreen' | 'softOrange' | 'brand';

export const screenTones = {
  /** Fondo general de la guía. */
  gray: { background: colors.marca.gris, statusBar: 'dark' },
  /** Pasos «Mira» y «Dilo» (fondo blanco en los mockups). */
  white: { background: colors.superficie.blanca, statusBar: 'dark' },
  /** Selección de sonido en Habla conmigo. */
  softGreen: { background: colors.verde.suave, statusBar: 'dark' },
  /** Busca la boca. */
  softOrange: { background: colors.naranja.suave, statusBar: 'dark' },
  /** Celebración (Listo). */
  brand: { background: colors.verde.oscuro, statusBar: 'light' },
} as const satisfies Record<
  ScreenTone,
  { background: ThemeColor; statusBar: 'dark' | 'light' }
>;

interface ScreenProps {
  tone?: ScreenTone;
  header?: ReactNode;
  children: ReactNode;
  /**
   * Acciones de la pantalla. Van fijas en la parte inferior, debajo del
   * contenido y nunca encima (regla «nada flota sobre el contenido»).
   */
  footer?: ReactNode;
  /** `false` para pantallas que no deben desplazarse (juegos). */
  scroll?: boolean;
  /**
   * `false` dentro de las pestañas: la barra inferior ya respeta el borde
   * inferior del teléfono.
   */
  safeAreaBottom?: boolean;
  /** Formas decorativas de fondo, detrás de todo (ver `Backdrop`). */
  backdrop?: BackdropKind;
  /**
   * Centra el contenido a lo alto en el espacio libre entre el encabezado y
   * las acciones (pantallas de «¡Listo!»). Si no cabe (letra grande), se
   * desplaza como siempre: no agrega alto de más.
   */
  centerContent?: boolean;
}

/** Marco común de toda pantalla: fondo, área segura, encabezado y acciones. */
export function Screen({
  tone = 'gray',
  header,
  children,
  footer,
  scroll = true,
  safeAreaBottom = true,
  backdrop,
  centerContent = false,
}: ScreenProps) {
  const config = screenTones[tone];
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: config.background }]}
      edges={
        safeAreaBottom
          ? ['top', 'bottom', 'left', 'right']
          : ['top', 'left', 'right']
      }
    >
      <StatusBar style={config.statusBar} />
      {backdrop ? <Backdrop kind={backdrop} /> : null}
      {header ? <View style={styles.header}>{header}</View> : null}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            centerContent && styles.centered,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.flex,
            styles.content,
            centerContent && styles.centered,
          ]}
        >
          {children}
        </View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  content: {
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  /** Llena el alto disponible y centra; crece si el contenido no cabe. */
  centered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
});
