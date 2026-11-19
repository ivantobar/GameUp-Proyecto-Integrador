import { StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { BottomTabBar, type BottomTabItem } from '@/components/ui';
import { colors, spacing, type ThemeColor } from '@/theme';

interface RoleTabBarProps<K extends string> extends BottomTabBarProps {
  items: readonly BottomTabItem<K>[];
  /**
   * Fondo detrás de la barra: el mismo de las pantallas del rol (crema en
   * las del niño, gris en las de los adultos), para que no quede una franja.
   */
  background?: ThemeColor;
}

/**
 * Conecta la barra inferior presentacional con el navegador de pestañas de
 * Expo Router. La usan el estudiante, el docente y la directora, cada uno
 * con sus pestañas. Va debajo del contenido, nunca encima.
 */
export function RoleTabBar<K extends string>({
  items,
  state,
  navigateToTab,
  insets,
  background = colors.marca.gris,
}: RoleTabBarProps<K>) {
  const current = state.routes[state.index]?.name ?? '';
  const fallback = items[0]?.key;
  const activeKey = items.find((tab) => tab.key === current)?.key ?? fallback;
  if (activeKey === undefined) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: background,
          paddingBottom: Math.max(insets.bottom, spacing.md),
        },
      ]}
    >
      <BottomTabBar
        items={items}
        activeKey={activeKey}
        onSelect={(name) => {
          // SDK 58: navigateToTab recibe la key de la ruta, no su nombre.
          const route = state.routes.find((r) => r.name === name);
          if (route) navigateToTab(route.key);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.xs,
  },
});
