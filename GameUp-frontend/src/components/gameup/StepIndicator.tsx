import { StyleSheet, View } from 'react-native';
import { AppText, Icon, type TextTone } from '@/components/ui';
import { colors, radii, sizes, spacing, type ThemeColor } from '@/theme';

type StepState = 'done' | 'current' | 'pending';

/**
 * Estados de cada paso. Además del color: el paso hecho lleva ✓ y el actual
 * va en negrita sobre naranja (forma y texto, no solo color).
 */
const stepStyles = {
  done: { background: colors.verde.suave, text: 'marca' },
  current: { background: colors.marca.naranja, text: 'principal' },
  pending: { background: colors.marca.gris, text: 'secundario' },
} as const satisfies Record<
  StepState,
  { background: ThemeColor; text: TextTone }
>;

interface StepIndicatorProps {
  steps: readonly string[];
  /** Paso actual, empezando en 0. */
  current: number;
}

/** Pasos «Mira · Dilo · Listo». */
export function StepIndicator({ steps, current }: StepIndicatorProps) {
  const label = `Paso ${current + 1} de ${steps.length}: ${steps[current] ?? ''}`;
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{
        min: 1,
        max: steps.length,
        now: current + 1,
        text: label,
      }}
    >
      {steps.map((step, index) => {
        const state: StepState =
          index < current ? 'done' : index === current ? 'current' : 'pending';
        const config = stepStyles[state];
        return (
          <View
            key={step}
            style={[styles.pill, { backgroundColor: config.background }]}
          >
            {state === 'done' ? (
              <Icon name="check" size="sm" color={colors.verde.oscuro} />
            ) : null}
            <AppText
              variant={state === 'current' ? 'bodyStrong' : 'support'}
              tone={config.text}
            >
              {step}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xxs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    minHeight: sizes.dotActiveWidth,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
  },
});
