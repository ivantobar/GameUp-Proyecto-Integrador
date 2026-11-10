import type { Href } from 'expo-router';

/**
 * Rutas del espacio de estudiantes de cada adulto. Las pantallas de lista,
 * detalle y asignar son las mismas para el docente y la directora; solo
 * cambia dónde viven.
 */
export interface StaffRoutes {
  detail(studentId: string): Href;
  assign(studentId: string): Href;
  /**
   * Actividades por revisar de un estudiante. `name` («Martín C.») sirve
   * para el título mientras cargan.
   */
  review(studentId: string, name?: string): Href;
  /** Cómo se llama la revisión en este espacio: «Por escuchar» o «Por validar». */
  reviewTitle: string;
}

export const teacherRoutes: StaffRoutes = {
  detail: (id) => ({ pathname: '/teacher/student/[id]', params: { id } }),
  assign: (id) => ({
    pathname: '/teacher/student/[id]/assign',
    params: { id },
  }),
  review: (id, name) => ({
    pathname: '/teacher/student/[id]/review',
    params: name ? { id, name } : { id },
  }),
  reviewTitle: 'Por escuchar',
};

export const directorRoutes: StaffRoutes = {
  detail: (id) => ({ pathname: '/director/student/[id]', params: { id } }),
  assign: (id) => ({
    pathname: '/director/student/[id]/assign',
    params: { id },
  }),
  review: (id, name) => ({
    pathname: '/director/student/[id]/review',
    params: name ? { id, name } : { id },
  }),
  reviewTitle: 'Por validar',
};

/** Directora · elegir la tallerista a cargo de un estudiante. */
export const assignTeacherRoute = (id: string): Href => ({
  pathname: '/director/student/[id]/teacher',
  params: { id },
});
