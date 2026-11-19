import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { curves, PressableSurface } from '@/components/ui';
import { Character, HintPill, Pictogram } from '@/components/gameup';
import { Breathe } from '@/components/gameup/motion';
import { useReducedMotion } from '@/features/motion/useReducedMotion';
import type { PictureFace } from '@/data/types';
import {
  colors,
  motion,
  radii,
  sizes,
  spacing,
  type ThemeColor,
} from '@/theme';
import type { MemoryCardView } from '../memoryGame';

/**
 * Cómo se ve cada carta (sin rojo y sin «incorrecto»):
 * - down: boca abajo, verde oscuro con el personaje;
 * - up: boca arriba, blanca;
 * - mismatch: dos cartas distintas a la vista; borde punteado mientras el
 *   niño las mira (se cierran cuando toque otra carta);
 * - matched: pareja encontrada, verde suave con «¡Pareja!».
 */
export const memoryCardStyles = {
  down: {
    background: colors.verde.oscuro,
    border: colors.verde.oscuro,
    edge: colors.verde.profundo,
    pressedBackground: colors.texto.principal,
    borderStyle: 'solid',
  },
  up: {
    background: colors.superficie.blanca,
    border: colors.verde.oscuro,
    edge: colors.borde.relieve,
    pressedBackground: colors.superficie.blanca,
    borderStyle: 'solid',
  },
  mismatch: {
    background: colors.superficie.blanca,
    border: colors.texto.secundario,
    edge: colors.borde.relieve,
    pressedBackground: colors.verde.suave,
    borderStyle: 'dashed',
  },
  matched: {
    background: colors.verde.suave,
    border: colors.verde.oscuro,
    edge: colors.verde.oscuro,
    pressedBackground: colors.verde.suave,
    borderStyle: 'solid',
  },
} as const satisfies Record<
  MemoryCardView,
  {
    background: ThemeColor;
    border: ThemeColor;
    edge: ThemeColor;
    pressedBackground: ThemeColor;
    borderStyle: 'solid' | 'dashed';
  }
>;

const stateLabels: Record<MemoryCardView, string> = {
  down: 'boca abajo',
  up: '',
  mismatch: 'no es su pareja',
  matched: 'pareja encontrada',
};

interface MemoryCardProps {
  /** Posición, desde 1 («Carta 1»). */
  position: number;
  face: PictureFace | undefined;
  view: MemoryCardView;
  onPress: () => void;
  /**
   * Tablero de 8 cartas o más (3 columnas): carta más baja y dibujo
   * mediano, para que el tablero quepa en el celular.
   */
  compact?: boolean;
}

/** Columnas del tablero: 3 desde 8 cartas (4 parejas), si no 2. */
export function memoryColumns(cardCount: number): 2 | 3 {
  return cardCount >= 8 ? 3 : 2;
}

/** Carta de «Memoria». Se toca para voltearla. */
export function MemoryCard({
  position,
  face,
  view,
  onPress,
  compact = false,
}: MemoryCardProps) {
  const config = memoryCardStyles[view];
  const isUp = view !== 'down';
  const locked = view === 'matched' || view === 'up';
  const label = [
    `Carta ${position}`,
    isUp ? face?.label : null,
    stateLabels[view] || null,
  ]
    .filter(Boolean)
    .join(', ');

  const flip = useFlip(isUp);

  return (
    // La pareja encontrada respira dos veces; antes, nada se mueve solo.
    <Breathe active={view === 'matched'} style={styles.grow}>
      <PressableSurface
        colors={{
          background: config.background,
          pressedBackground: config.pressedBackground,
          border: config.border,
          pressedBorder: config.border,
          edge: config.edge,
        }}
        onPress={onPress}
        disabled={locked}
        accessibilityLabel={label}
        accessibilityHint={view === 'down' ? 'Toca para voltearla' : undefined}
        accessibilityState={{ selected: view === 'matched' }}
        depth="md"
        pressScale
        radius={radii.card}
        borderWidth={sizes.borderStrong + 1}
        borderStyle={config.borderStyle}
        // Los de una misma fila miden lo mismo.
        fill
        style={styles.grow}
        contentStyle={[styles.card, compact && styles.compact]}
      >
        <Animated.View style={[styles.face, flip]}>
          {isUp && face ? (
            <Pictogram face={face} size={compact ? 'md' : 'lg'} />
          ) : (
            <Character mouth="smile" size="xs" />
          )}
          {view === 'matched' ? (
            <HintPill kind="correct" label="¡Pareja!" />
          ) : null}
        </Animated.View>
      </PressableSurface>
    </Breathe>
  );
}

/**
 * Volteo suave: al cambiar de cara, el dibujo se estrecha y vuelve a abrirse
 * (escala horizontal, 150 ms cada mitad), como una carta que gira. Con
 * «reducir movimiento», cambia sin animación.
 */
function useFlip(isUp: boolean) {
  const reduced = useReducedMotion();
  const scaleX = useSharedValue(1);
  const previous = useRef(isUp);

  useEffect(() => {
    if (previous.current === isUp) return;
    previous.current = isUp;
    if (reduced) return;
    const half = { duration: motion.duration.state, easing: curves.out };
    scaleX.value = 0;
    scaleX.value = withTiming(1, half);
  }, [isUp, reduced, scaleX]);

  return useAnimatedStyle(() => ({ transform: [{ scaleX: scaleX.value }] }));
}

const styles = StyleSheet.create({
  /**
   * Crece para llenar el alto de su fila, con base en su contenido. No es
   * `flex: 1`: en vertical, `flex: 1` (base 0) puede colapsar a alto 0
   * dentro del contenido desplazable.
   */
  grow: {
    flexGrow: 1,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: sizes.pictureTile + spacing.xxxl,
    padding: spacing.sm,
  },
  face: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  compact: {
    minHeight: sizes.pictureTile,
    padding: spacing.xs,
  },
});
