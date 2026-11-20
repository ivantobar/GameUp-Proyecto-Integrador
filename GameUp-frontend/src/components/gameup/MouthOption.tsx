import { StyleSheet, View } from 'react-native';
import { PressableSurface } from '@/components/ui';
import { colors, radii, sizes, spacing, type ThemeColor } from '@/theme';
import type { Vowel } from '@/data/types';
import { HintPill } from './HintPill';
import { Breathe } from './motion';
import { Mouth } from './Mouth';
import { mouthDescriptions } from './mouthShapes';

/**
 * Estados de una boca en «Busca la boca»:
 * - idle: normal;
 * - hint: el niño se equivocó y esta es la correcta (borde punteado y
 *   «Prueba esta»: pista, no castigo);
 * - correct: la eligió bien («¡Es la O!» con ✓);
 * - dimmed: otra boca, cuando la ronda ya está resuelta.
 *
 * Nunca se marca una opción como «incorrecta» ni se usa rojo, ni el color
 * del juego: los estados usan los verdes de la guía. Misma tarjeta con
 * relieve, «respiración» y píldora (con la manito) que los juegos de pensar.
 */
export type MouthOptionState = 'idle' | 'hint' | 'correct' | 'dimmed';

interface StateStyle {
  background: ThemeColor;
  border: ThemeColor;
  borderStyle: 'solid' | 'dashed';
  edge: ThemeColor;
}

export const mouthOptionStates = {
  idle: {
    background: colors.superficie.blanca,
    border: colors.borde.suave,
    borderStyle: 'solid',
    edge: colors.borde.relieve,
  },
  hint: {
    background: colors.superficie.blanca,
    border: colors.verde.oscuro,
    borderStyle: 'dashed',
    edge: colors.borde.relieve,
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
    edge: colors.borde.relieve,
  },
} as const satisfies Record<MouthOptionState, StateStyle>;

interface MouthOptionProps {
  vowel: Vowel;
  state: MouthOptionState;
  onPress: () => void;
}

/** Tarjeta grande con una boca para tocar (mockup 7). */
export function MouthOption({ vowel, state, onPress }: MouthOptionProps) {
  const config = mouthOptionStates[state];
  const letter = vowel.toUpperCase();
  const pill =
    state === 'correct'
      ? ({ kind: 'correct', label: `¡Es la ${letter}!` } as const)
      : state === 'hint'
        ? ({ kind: 'hint', label: 'Prueba esta' } as const)
        : null;
  const locked = state === 'correct' || state === 'dimmed';

  const description = mouthDescriptions[vowel];
  const label =
    state === 'correct'
      ? `${description}. ¡Es la ${letter}!`
      : state === 'hint'
        ? `${description}. Pista: prueba esta`
        : description;

  return (
    // Respira solo con la pista o al acertar: nunca antes.
    <Breathe active={state === 'hint' || state === 'correct'}>
      <PressableSurface
        colors={{
          background: config.background,
          pressedBackground:
            state === 'idle' ? colors.verde.suave : config.background,
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
        contentStyle={styles.card}
      >
        <Mouth vowel={vowel} size="md" decorative />
        <View style={styles.spacer} />
        {pill ? <HintPill kind={pill.kind} label={pill.label} /> : null}
      </PressableSurface>
    </Breathe>
  );
}

/** Opacidad de las bocas que ya no se pueden tocar (igual que PictureCard). */
const DIMMED_OPACITY = 0.6;

const styles = StyleSheet.create({
  /** Con letra grande, la píldora baja debajo de la boca (flexWrap). */
  card: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: sizes.mouthOption,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxs,
  },
  spacer: {
    flexGrow: 1,
  },
});
