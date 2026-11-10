import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { BottomTabItem } from '@/components/ui';
import { RoleTabBar } from '@/features/navigation/RoleTabBar';

export type TeacherTabRoute = 'index' | 'students';

export const teacherTabs: readonly BottomTabItem<TeacherTabRoute>[] = [
  { key: 'index', label: 'Por revisar', icon: 'review' },
  { key: 'students', label: 'Mis estudiantes', icon: 'student' },
];

/** Barra inferior del docente: «Por revisar» y «Mis estudiantes». */
export function TeacherTabBar(props: BottomTabBarProps) {
  return <RoleTabBar {...props} items={teacherTabs} />;
}
