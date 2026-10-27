import { colors } from '@/theme';
import { stackAnimation } from './stackAnimation';
import { useReducedMotion } from './useReducedMotion';

/**
 * Opciones comunes de todos los stacks de la app: sin encabezado nativo
 * (cada pantalla usa `ScreenHeader`), fondo gris y la transición que
 * corresponda según «reducir movimiento».
 */
export function useStackScreenOptions() {
  const reducedMotion = useReducedMotion();
  return {
    headerShown: false,
    contentStyle: { backgroundColor: colors.marca.gris },
    ...stackAnimation(reducedMotion),
  } as const;
}
