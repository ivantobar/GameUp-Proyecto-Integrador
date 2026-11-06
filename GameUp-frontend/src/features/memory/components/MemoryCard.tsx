import { Pressable, StyleSheet } from 'react-native';
import { Character, HintPill, Pictogram } from '@/components/gameup';
import type { PictureFace } from '@/data/types';
import { colors, radii, sizes, spacing, type ThemeColor } from '@/theme';
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
    borderStyle: 'solid',
  },
  up: {
    background: colors.superficie.blanca,
    border: colors.verde.oscuro,
    borderStyle: 'solid',
  },
  mismatch: {
    background: colors.superficie.blanca,
    border: colors.texto.secundario,
    borderStyle: 'dashed',
  },
  matched: {
    background: colors.verde.suave,
    border: colors.verde.oscuro,
    borderStyle: 'solid',
  },
} as const satisfies Record<
  MemoryCardView,
  {
    background: ThemeColor;
    border: ThemeColor;
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

  return (
    <Pressable
      onPress={onPress}
      disabled={locked}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={view === 'down' ? 'Toca para voltearla' : undefined}
      accessibilityState={{ disabled: locked, selected: view === 'matched' }}
      style={({ pressed }) => [
        styles.card,
        compact && styles.compact,
        {
          backgroundColor:
            pressed && view === 'down'
              ? colors.texto.principal
              : config.background,
          borderColor: config.border,
          borderStyle: config.borderStyle,
        },
      ]}
    >
      {isUp && face ? (
        <Pictogram face={face} size={compact ? 'md' : 'lg'} />
      ) : (
        <Character mouth="smile" size="xs" />
      )}
      {view === 'matched' ? <HintPill kind="correct" label="¡Pareja!" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: sizes.pictureTile + spacing.xxxl,
    padding: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: sizes.borderStrong + 1,
  },
  compact: {
    minHeight: sizes.pictureTile,
    padding: spacing.xs,
  },
});
