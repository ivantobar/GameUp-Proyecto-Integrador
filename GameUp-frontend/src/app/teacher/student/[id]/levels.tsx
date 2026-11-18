import { useLocalSearchParams } from 'expo-router';
import { LevelAdjustView } from '@/features/levels/components/LevelAdjustView';

/** Docente · «Cambiar nivel» (solo puede bajarlo). */
export default function TeacherLevelsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LevelAdjustView studentId={id} canRaise={false} />;
}
