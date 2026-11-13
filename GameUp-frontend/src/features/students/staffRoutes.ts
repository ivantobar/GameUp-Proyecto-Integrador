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
  /** Cómo se llama la revisión en este espacio: «Por revisar» o «Por validar». */
  reviewTitle: string;
  /** «Cambiar nivel» de los juegos con escalera. */
  levels(studentId: string): Href;
  /**
   * Puede SUBIR el nivel a mano (solo la directora). La tallerista solo
   * baja: sube al niño aprobando un intento del nivel actual.
   */
  canRaiseLevels: boolean;
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
  reviewTitle: 'Por revisar',
  levels: (id) => ({
    pathname: '/teacher/student/[id]/levels',
    params: { id },
  }),
  canRaiseLevels: false,
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
  levels: (id) => ({
    pathname: '/director/student/[id]/levels',
    params: { id },
  }),
  canRaiseLevels: true,
};

/** Directora · elegir la tallerista a cargo de un estudiante. */
export const assignTeacherRoute = (id: string): Href => ({
  pathname: '/director/student/[id]/teacher',
  params: { id },
});
