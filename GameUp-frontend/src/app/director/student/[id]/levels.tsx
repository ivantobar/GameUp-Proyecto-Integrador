import { useLocalSearchParams } from 'expo-router';
import { LevelAdjustView } from '@/features/levels/components/LevelAdjustView';

/** Directora · «Cambiar nivel» (puede subirlo o bajarlo). */
export default function DirectorLevelsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LevelAdjustView studentId={id} canRaise />;
}
