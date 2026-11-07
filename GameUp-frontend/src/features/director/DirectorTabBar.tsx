import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { BottomTabItem } from '@/components/ui';
import { RoleTabBar } from '@/features/navigation/RoleTabBar';

export type DirectorTabRoute = 'index' | 'review' | 'summary';

export const directorTabs: readonly BottomTabItem<DirectorTabRoute>[] = [
  { key: 'index', label: 'Estudiantes', icon: 'student' },
  { key: 'review', label: 'Por validar', icon: 'ear' },
  { key: 'summary', label: 'Resumen', icon: 'info' },
];

/** Barra inferior de la directora. */
export function DirectorTabBar(props: BottomTabBarProps) {
  return <RoleTabBar {...props} items={directorTabs} />;
}
