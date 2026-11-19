import type { ScreenTone } from '@/components/ui';
import type { GameId } from '@/data/types';
import { colors, type ThemeColor } from '@/theme';

interface GameTheme {
  /** Fondo de la pantalla del juego (`Screen`). */
  screen: ScreenTone;
  /** Fondo suave (recuadros de identidad). */
  background: ThemeColor;
  /** Acento de identidad: franja del encabezado y recuadro del dibujo. */
  accent: ThemeColor;
}

/**
 * Identidad de cada juego (color + dibujo + fondo) para que el niño lo
 * reconozca sin leer.
 *
 * Regla: estos colores son SOLO identidad. Nunca marcan el estado de una
 * opción: elegido, pista y acierto usan siempre los verdes de la guía (así
 * el coral de Emparejar nunca se confunde con «elegiste mal»).
 */
export const gameThemes = {
  match: {
    screen: 'match',
    background: colors.identidad.emparejarFondo,
    accent: colors.identidad.emparejarAcento,
  },
  classify: {
    screen: 'classify',
    background: colors.identidad.clasificarFondo,
    accent: colors.identidad.clasificarAcento,
  },
  sequence: {
    screen: 'sequence',
    background: colors.juego.fondoAmarillo,
    accent: colors.identidad.secuenciarAcento,
  },
  memory: {
    screen: 'memory',
    background: colors.identidad.memoriaFondo,
    accent: colors.identidad.memoriaAcento,
  },
  speak: {
    screen: 'softGreen',
    background: colors.verde.suave,
    accent: colors.verde.oscuro,
  },
  findMouth: {
    screen: 'findMouth',
    background: colors.identidad.bocaFondo,
    accent: colors.identidad.bocaAcento,
  },
} as const satisfies Record<GameId, GameTheme>;
