import { PendingStudentsView } from '@/features/review/components/PendingStudentsView';
import { teacherRoutes } from '@/features/students/staffRoutes';

/**
 * Pantalla 8 · Docente: «Por revisar», primero se elige el estudiante. El
 * aviso «Gestos de la fundación» queda oculto hasta que grabar un gesto
 * funcione (hoy su botón no hace nada).
 */
export default function TeacherReviewScreen() {
  return (
    <PendingStudentsView routes={teacherRoutes} showGestureNotice={false} />
  );
}
