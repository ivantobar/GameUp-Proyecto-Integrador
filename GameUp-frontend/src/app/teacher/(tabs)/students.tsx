import { SignOutButton } from '@/features/auth/components/SignOutButton';
import { StudentRosterView } from '@/features/students/components/StudentRosterView';
import { teacherRoutes } from '@/features/students/staffRoutes';

/** Docente · «Mis estudiantes»: solo los suyos (lo decide el backend). */
export default function TeacherStudentsScreen() {
  return (
    <StudentRosterView
      title="Mis estudiantes"
      routes={teacherRoutes}
      emptyTitle="Todavía no tienes estudiantes asignados"
      emptyMessage="Cuando la fundación te asigne estudiantes, aparecerán aquí."
      headerRight={<SignOutButton />}
    />
  );
}
