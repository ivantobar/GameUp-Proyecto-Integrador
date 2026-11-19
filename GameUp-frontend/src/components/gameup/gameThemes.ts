import type { GameId } from '@/data/types';
import { colors, type ThemeColor } from '@/theme';

interface GameTheme {
  /** Fondo suave detrás del dibujo del juego (recuadro del `GameIcon`). */
  background: ThemeColor;
}

/**
 * Identidad de cada juego: su dibujo y un fondo suave detrás (para
 * reconocerlo sin leer).
 *
 * Regla (guía de ASISCO UP): el color de identidad va SOLO en el recuadro
 * del dibujo. Nunca en botones, textos, encabezados, fondos de pantalla ni
 * estados de una opción (elegido, pista y acierto usan los verdes de la
 * guía). Ver `GameIconFrame`.
 */
export const gameThemes = {
  match: { background: colors.identidad.emparejarFondo },
  classify: { background: colors.identidad.clasificarFondo },
  sequence: { background: colors.juego.fondoAmarillo },
  memory: { background: colors.identidad.memoriaFondo },
  speak: { background: colors.verde.suave },
  findMouth: { background: colors.identidad.bocaFondo },
} as const satisfies Record<GameId, GameTheme>;
