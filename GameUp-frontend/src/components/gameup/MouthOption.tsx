import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Icon, type IconName, type TextTone } from '@/components/ui';
import { colors, radii, sizes, spacing, type ThemeColor } from '@/theme';
import type { Vowel } from '@/data/types';
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
 * Nunca se marca una opción como «incorrecta» ni se usa rojo.
 */
export type MouthOptionState = 'idle' | 'hint' | 'correct' | 'dimmed';

interface StateStyle {
  background: ThemeColor;
  border: ThemeColor;
  borderStyle: 'solid' | 'dashed';
}

const optionStates = {
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
} as const satisfies Record<MouthOptionState, StateStyle>;

const pillStyles = {
  hint: {
    background: colors.verde.suave,
    text: 'marca',
    icon: 'hand',
    iconColor: colors.verde.oscuro,
  },
  correct: {
    background: colors.verde.oscuro,
    text: 'sobreOscuro',
    icon: 'check',
    iconColor: colors.texto.sobreOscuro,
  },
} as const satisfies Record<
  'hint' | 'correct',
  {
    background: ThemeColor;
    text: TextTone;
    icon: IconName;
    iconColor: ThemeColor;
  }
>;

interface MouthOptionProps {
  vowel: Vowel;
  state: MouthOptionState;
  onPress: () => void;
}

/** Tarjeta grande con una boca para tocar (mockup 7). */
export function MouthOption({ vowel, state, onPress }: MouthOptionProps) {
  const config = optionStates[state];
  const letter = vowel.toUpperCase();
  const pill =
    state === 'correct'
      ? { ...pillStyles.correct, label: `¡Es la ${letter}!` }
      : state === 'hint'
        ? { ...pillStyles.hint, label: 'Prueba esta' }
        : null;

  const description = mouthDescriptions[vowel];
  const label =
    state === 'correct'
      ? `${description}. ¡Es la ${letter}!`
      : state === 'hint'
        ? `${description}. Pista: prueba esta`
        : description;

  return (
    <Pressable
      onPress={onPress}
      disabled={state === 'correct' || state === 'dimmed'}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        selected: state === 'correct',
        disabled: state === 'correct' || state === 'dimmed',
      }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor:
            pressed && state === 'idle'
              ? colors.verde.suave
              : config.background,
          borderColor: config.border,
          borderStyle: config.borderStyle,
          opacity: state === 'dimmed' ? 0.6 : 1,
        },
      ]}
    >
      <Mouth vowel={vowel} size="md" decorative />
      <View style={styles.spacer} />
      {pill ? (
        <View style={[styles.pill, { backgroundColor: pill.background }]}>
          <Icon name={pill.icon} size="sm" color={pill.iconColor} />
          <AppText variant="bodyStrong" tone={pill.text}>
            {pill.label}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.mouthOption,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxs,
    borderRadius: radii.xl,
    borderWidth: sizes.borderStrong + 1,
  },
  spacer: {
    flex: 1,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
  },
});
