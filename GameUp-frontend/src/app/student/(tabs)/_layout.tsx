import { Tabs } from 'expo-router/js-tabs';
import { StudentTabBar, studentTabs } from '@/features/home/StudentTabBar';
import { colors } from '@/theme';

/**
 * Pestañas del estudiante: Inicio, Juegos y Progreso.
 *
 * SDK 58: Expo Router solo muestra las pantallas declaradas en el layout
 * (si no hay ninguna, el navegador no dibuja nada). Se declaran a partir de
 * `studentTabs`, la misma lista que usa la barra inferior.
 */
export default function StudentTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <StudentTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.marca.gris },
      }}
    >
      {studentTabs.map((tab) => (
        <Tabs.Screen key={tab.key} name={tab.key} />
      ))}
    </Tabs>
  );
}
