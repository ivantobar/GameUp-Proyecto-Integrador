import { useLocalSearchParams } from 'expo-router';
import { AssignTeacherView } from '@/features/students/components/AssignTeacherView';

/** Directora · «Asignar tallerista» de un estudiante. */
export default function DirectorAssignTeacherScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AssignTeacherView studentId={id} />;
}
