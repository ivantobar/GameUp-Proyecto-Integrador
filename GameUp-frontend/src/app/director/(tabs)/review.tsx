import { PendingStudentsView } from '@/features/review/components/PendingStudentsView';
import { directorRoutes } from '@/features/students/staffRoutes';

/** Directora · «Por validar»: los estudiantes de todos con pendientes. */
export default function DirectorReviewScreen() {
  return (
    <PendingStudentsView routes={directorRoutes} showGestureNotice={false} />
  );
}
