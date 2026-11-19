import { StyleSheet, View } from 'react-native';
import { AppText, PressableSurface } from '@/components/ui';
import type { PictureFace } from '@/data/types';
import { colors, radii, sizes, spacing, type ThemeColor } from '@/theme';
import { HintPill } from './HintPill';
import { Breathe } from './motion';
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
 * Nunca se marca una opción como «incorrecta» ni se usa rojo. Los estados
 * usan siempre los verdes de la guía, nunca el color del juego.
 *
 * Relieve plano: la tarjeta que se puede tocar tiene borde inferior y se
 * hunde al presionar; la resuelta queda plana («ya se tocó»).
 */
export type PictureCardState = 'idle' | 'hint' | 'correct' | 'dimmed';

export const pictureCardStates = {
  idle: {
    background: colors.superficie.blanca,
    border: colors.borde.suave,
    borderStyle: 'solid',
    edge: colors.relieve.superficie,
  },
  hint: {
    background: colors.superficie.blanca,
    border: colors.verde.oscuro,
    borderStyle: 'dashed',
    edge: colors.relieve.superficie,
  },
  correct: {
    background: colors.verde.suave,
    border: colors.verde.oscuro,
    borderStyle: 'solid',
    edge: colors.verde.oscuro,
  },
  dimmed: {
    background: colors.superficie.blanca,
    border: colors.borde.suave,
    borderStyle: 'solid',
    edge: colors.relieve.superficie,
  },
} as const satisfies Record<
  PictureCardState,
  {
    background: ThemeColor;
    border: ThemeColor;
    borderStyle: 'solid' | 'dashed';
    edge: ThemeColor;
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
    // Respira solo con la pista o al acertar: nunca antes (no regala la
    // respuesta).
    <Breathe
      active={state === 'hint' || state === 'correct'}
      style={isTile ? styles.grow : undefined}
      testID="picture-card-breathe"
    >
      <PressableSurface
        colors={{
          background: config.background,
          pressedBackground:
            state === 'correct' ? config.background : colors.verde.suave,
          border: config.border,
          pressedBorder: colors.verde.oscuro,
          edge: config.edge,
        }}
        onPress={onPress}
        disabled={locked}
        accessibilityLabel={label}
        accessibilityState={{ selected: state === 'correct' }}
        depth="md"
        pressScale
        radius={radii.card}
        borderWidth={sizes.borderStrong + 1}
        borderStyle={config.borderStyle}
        opacity={state === 'dimmed' ? DIMMED_OPACITY : 1}
        // En cuadrícula, las tarjetas de una fila miden lo mismo.
        fill={isTile}
        style={isTile ? styles.grow : undefined}
        contentStyle={[styles.card, isTile ? styles.tile : styles.row]}
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
      </PressableSurface>
    </Breathe>
  );
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
