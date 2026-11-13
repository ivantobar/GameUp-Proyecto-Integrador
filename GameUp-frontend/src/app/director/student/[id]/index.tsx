import { useLocalSearchParams } from 'expo-router';
import { StudentDetailView } from '@/features/students/components/StudentDetailView';
import { directorRoutes } from '@/features/students/staffRoutes';

/**
 * Directora · detalle de un estudiante: la misma vista del docente, más
 * «Tallerista a cargo» y «Grabaciones de voz» (borrarlas).
 */
export default function DirectorStudentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <StudentDetailView
      studentId={id}
      routes={directorRoutes}
      manageTeachers
      manageRecordings
    />
  );
}
