import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { BottomTabItem } from '@/components/ui';
import { RoleTabBar } from '@/features/navigation/RoleTabBar';

export type StudentTabRoute = 'index' | 'games' | 'progress';

export const studentTabs: readonly BottomTabItem<StudentTabRoute>[] = [
  { key: 'index', label: 'Inicio', icon: 'home' },
  { key: 'games', label: 'Juegos', icon: 'game' },
  { key: 'progress', label: 'Progreso', icon: 'starOutline' },
];

/** Barra inferior del estudiante: Inicio, Juegos y Progreso. */
export function StudentTabBar(props: BottomTabBarProps) {
  return <RoleTabBar {...props} items={studentTabs} />;
}
