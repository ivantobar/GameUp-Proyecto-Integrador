import { StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { BottomTabBar, type BottomTabItem } from '@/components/ui';
import { colors, spacing } from '@/theme';

interface RoleTabBarProps<K extends string> extends BottomTabBarProps {
  items: readonly BottomTabItem<K>[];
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
}: RoleTabBarProps<K>) {
  const current = state.routes[state.index]?.name ?? '';
  const fallback = items[0]?.key;
  const activeKey = items.find((tab) => tab.key === current)?.key ?? fallback;
  if (activeKey === undefined) return null;

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, spacing.md) },
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
    backgroundColor: colors.marca.gris,
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.xs,
  },
});
