import { useLocalSearchParams } from 'expo-router';
import { StudentDetailView } from '@/features/students/components/StudentDetailView';
import { teacherRoutes } from '@/features/students/staffRoutes';

/** Docente · detalle de un estudiante. */
export default function TeacherStudentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <StudentDetailView studentId={id} routes={teacherRoutes} />;
}
