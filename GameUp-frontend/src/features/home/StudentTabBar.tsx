import { StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { BottomTabBar, type BottomTabItem } from '@/components/ui';
import { colors, spacing } from '@/theme';

export type StudentTabRoute = 'index' | 'games' | 'progress';

export const studentTabs: readonly BottomTabItem<StudentTabRoute>[] = [
  { key: 'index', label: 'Inicio', icon: 'home' },
  { key: 'games', label: 'Juegos', icon: 'game' },
  { key: 'progress', label: 'Progreso', icon: 'starOutline' },
];

function isStudentTab(name: string): name is StudentTabRoute {
  return studentTabs.some((tab) => tab.key === name);
}

/**
 * Conecta la barra inferior presentacional con el navegador de pestañas de
 * Expo Router. Va debajo del contenido, nunca encima.
 */
export function StudentTabBar({
  state,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  const current = state.routes[state.index]?.name ?? 'index';
  const activeKey = isStudentTab(current) ? current : 'index';

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, spacing.md) },
      ]}
    >
      <BottomTabBar
        items={studentTabs}
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
