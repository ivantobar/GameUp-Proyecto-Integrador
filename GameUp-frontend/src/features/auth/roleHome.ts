import type { Href } from 'expo-router';
import type { UserRole } from '@/data/types';

/**
 * Pantalla de inicio de cada rol después de iniciar sesión. `null`: el rol
 * todavía no tiene pantallas (la directora no tiene mockup).
 * Mostrar una ruta no da permisos: el backend los verifica en cada petición.
 */
export const roleHomes: Record<UserRole, Href | null> = {
  student: '/student',
  teacher: '/teacher',
  guardian: '/guardian',
  director: null,
};
