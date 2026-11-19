import { useWindowDimensions } from 'react-native';
import { LARGE_TEXT_SCALE } from '@/theme';

/** ¿La escala de letra del sistema pide pasar a una columna? */
export function isLargeText(fontScale: number): boolean {
  return fontScale >= LARGE_TEXT_SCALE;
}

/**
 * Indica si la persona usa letra grande en el teléfono (130 % o más). Se
 * actualiza solo si cambia el ajuste con la app abierta.
 */
export function useLargeText(): boolean {
  return isLargeText(useWindowDimensions().fontScale);
}
