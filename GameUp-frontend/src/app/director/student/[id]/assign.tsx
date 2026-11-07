import { useLocalSearchParams } from 'expo-router';
import { AssignModuleView } from '@/features/students/components/AssignModuleView';

/** Directora · «Asignar actividad» (la misma vista del docente). */
export default function DirectorAssignScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AssignModuleView studentId={id} />;
}
