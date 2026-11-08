import { Tabs } from 'expo-router/js-tabs';
import {
  DirectorTabBar,
  directorTabs,
} from '@/features/director/DirectorTabBar';
import { colors } from '@/theme';

/**
 * Pestañas de la directora. `/director` abre «Estudiantes» (`index`).
 * SDK 58: se declaran a partir de `directorTabs`, la misma lista de la barra.
 */
export default function DirectorTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <DirectorTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.marca.gris },
      }}
    >
      {directorTabs.map((tab) => (
        <Tabs.Screen key={tab.key} name={tab.key} />
      ))}
    </Tabs>
  );
}
