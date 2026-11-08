import { SignOutButton } from '@/features/auth/components/SignOutButton';
import { StudentRosterView } from '@/features/students/components/StudentRosterView';
import { directorRoutes } from '@/features/students/staffRoutes';

/** Directora · «Estudiantes»: todos (lo decide el backend), con búsqueda. */
export default function DirectorStudentsScreen() {
  return (
    <StudentRosterView
      title="Estudiantes"
      routes={directorRoutes}
      emptyTitle="Todavía no hay estudiantes"
      emptyMessage="Cuando la fundación registre estudiantes, aparecerán aquí."
      headerRight={<SignOutButton />}
      searchable
    />
  );
}
