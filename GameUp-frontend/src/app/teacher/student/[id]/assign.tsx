import { useLocalSearchParams } from 'expo-router';
import { AssignModuleView } from '@/features/students/components/AssignModuleView';

/** Docente · «Asignar actividad» a un estudiante. */
export default function TeacherAssignScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AssignModuleView studentId={id} />;
}
