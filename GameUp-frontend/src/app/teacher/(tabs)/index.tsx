import { PendingStudentsView } from '@/features/review/components/PendingStudentsView';
import { teacherRoutes } from '@/features/students/staffRoutes';

/** Pantalla 8 · Docente: «Por revisar», primero se elige el estudiante. */
export default function TeacherReviewScreen() {
  return <PendingStudentsView routes={teacherRoutes} />;
}
