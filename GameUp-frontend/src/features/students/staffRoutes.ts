import type { Href } from 'expo-router';

/**
 * Rutas del espacio de estudiantes de cada adulto. Las pantallas de lista,
 * detalle y asignar son las mismas para el docente y la directora; solo
 * cambia dónde viven.
 */
export interface StaffRoutes {
  detail(studentId: string): Href;
  assign(studentId: string): Href;
}

export const teacherRoutes: StaffRoutes = {
  detail: (id) => ({ pathname: '/teacher/student/[id]', params: { id } }),
  assign: (id) => ({
    pathname: '/teacher/student/[id]/assign',
    params: { id },
  }),
};

export const directorRoutes: StaffRoutes = {
  detail: (id) => ({ pathname: '/director/student/[id]', params: { id } }),
  assign: (id) => ({
    pathname: '/director/student/[id]/assign',
    params: { id },
  }),
};

/** Directora · elegir la tallerista a cargo de un estudiante. */
export const assignTeacherRoute = (id: string): Href => ({
  pathname: '/director/student/[id]/teacher',
  params: { id },
});
