import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import type { PictureFace } from '@/data/types';
import { colors, radii, sizes, spacing, type ThemeColor } from '@/theme';
import { HintPill } from './HintPill';
import { Pictogram } from './Pictogram';

/**
 * Estados de una opción en Emparejar y Secuenciar (los mismos de
 * «Busca la boca»):
 * - idle: normal;
 * - hint: el niño se equivocó y esta es la correcta (borde punteado y
 *   «Prueba esta»: pista, no castigo);
 * - correct: la eligió bien («¡Muy bien!» con ✓);
 * - dimmed: otra opción, cuando la ronda ya está resuelta.
 *
 * Nunca se marca una opción como «incorrecta» ni se usa rojo.
 */
export type PictureCardState = 'idle' | 'hint' | 'correct' | 'dimmed';

export const pictureCardStates = {
  idle: {
    background: colors.superficie.blanca,
    border: colors.borde.suave,
    borderStyle: 'solid',
  },
  hint: {
    background: colors.superficie.blanca,
    border: colors.verde.oscuro,
    borderStyle: 'dashed',
  },
  correct: {
    background: colors.verde.suave,
    border: colors.verde.oscuro,
    borderStyle: 'solid',
  },
  dimmed: {
    background: colors.superficie.blanca,
    border: colors.borde.suave,
    borderStyle: 'solid',
  },
} as const satisfies Record<
  PictureCardState,
  {
    background: ThemeColor;
    border: ThemeColor;
    borderStyle: 'solid' | 'dashed';
  }
>;

/** Opacidad de las opciones que ya no se pueden tocar (igual que MouthOption). */
const DIMMED_OPACITY = 0.6;

interface PictureCardProps {
  face: PictureFace;
  state: PictureCardState;
  onPress: () => void;
  /**
   * `row`: tarjeta ancha, una debajo de otra (Emparejar).
   * `tile`: tarjeta cuadrada en cuadrícula de 2 (Secuenciar).
   */
  layout?: 'row' | 'tile';
  /** Muestra el nombre debajo del dibujo (pasos de una rutina). */
  showLabel?: boolean;
  /** Texto del acierto. Por defecto, «¡Muy bien!». */
  correctLabel?: string;
}

/** Tarjeta grande con un dibujo, palabra o número para tocar. */
export function PictureCard({
  face,
  state,
  onPress,
  layout = 'row',
  showLabel = false,
  correctLabel = '¡Muy bien!',
}: PictureCardProps) {
  const config = pictureCardStates[state];
  const locked = state === 'correct' || state === 'dimmed';
  const pill =
    state === 'correct'
      ? ({ kind: 'correct', label: correctLabel } as const)
      : state === 'hint'
        ? ({ kind: 'hint', label: 'Prueba esta' } as const)
        : null;
  const label = pill
    ? `${face.label}. ${state === 'hint' ? 'Pista: prueba esta' : pill.label}`
    : face.label;
  const isTile = layout === 'tile';

  return (
    <Pressable
      onPress={onPress}
      disabled={locked}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: state === 'correct', disabled: locked }}
      style={({ pressed }) => [
        styles.card,
        isTile ? styles.tile : styles.row,
        {
          backgroundColor:
            pressed && state !== 'correct'
              ? colors.verde.suave
              : config.background,
          borderColor: config.border,
          borderStyle: config.borderStyle,
          opacity: state === 'dimmed' ? DIMMED_OPACITY : 1,
        },
      ]}
    >
      <Pictogram face={face} />
      {showLabel ? (
        <AppText
          variant="bodyStrong"
          style={isTile ? styles.centerText : styles.flex}
        >
          {face.label}
        </AppText>
      ) : null}
      {isTile ? null : <View style={styles.flex} />}
      {pill ? <HintPill kind={pill.kind} label={pill.label} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: sizes.borderStrong + 1,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.pictureRow,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xs,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: sizes.pictureTile,
    padding: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  centerText: {
    textAlign: 'center',
  },
});
