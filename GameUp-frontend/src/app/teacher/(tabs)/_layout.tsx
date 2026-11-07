import { Tabs } from 'expo-router/js-tabs';
import { TeacherTabBar, teacherTabs } from '@/features/teacher/TeacherTabBar';
import { colors } from '@/theme';

/**
 * Pestañas del docente. `/teacher` abre «Por escuchar» (`index`).
 *
 * SDK 58: Expo Router solo muestra las pantallas declaradas en el layout;
 * se declaran a partir de `teacherTabs`, la misma lista de la barra.
 */
export default function TeacherTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TeacherTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.marca.gris },
      }}
    >
      {teacherTabs.map((tab) => (
        <Tabs.Screen key={tab.key} name={tab.key} />
      ))}
    </Tabs>
  );
}
