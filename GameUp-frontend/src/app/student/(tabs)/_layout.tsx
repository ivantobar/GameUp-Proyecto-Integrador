import { Tabs } from 'expo-router/js-tabs';
import { StudentTabBar } from '@/features/home/StudentTabBar';
import { colors } from '@/theme';

/** Pestañas del estudiante: Inicio, Juegos y Progreso. */
export default function StudentTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <StudentTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.marca.gris },
      }}
    />
  );
}
