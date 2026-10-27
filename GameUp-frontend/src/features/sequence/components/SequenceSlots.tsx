import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import type { PictureFace } from '@/data/types';
import { colors, radii, sizes, spacing } from '@/theme';

interface SequenceSlotsProps {
  /** Cuántos pasos tiene la rutina. */
  total: number;
  /** Pasos ya ordenados, en su lugar. */
  placed: readonly PictureFace[];
}

/**
 * Casillas numeradas de la rutina (1, 2, 3…). La siguiente por llenar se
 * distingue por la forma (borde punteado), no solo por el color.
 */
export function SequenceSlots({ total, placed }: SequenceSlotsProps) {
  const summary = Array.from({ length: total }, (_, index) => {
    const step = placed[index];
    return `${index + 1}: ${step ? step.label : 'falta'}`;
  }).join('. ');

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`Pasos. ${summary}`}
    >
      {Array.from({ length: total }, (_, index) => {
        const step = placed[index];
        const isNext = index === placed.length;
        return (
          <View
            key={index}
            style={[
              styles.slot,
              step ? styles.filled : styles.empty,
              isNext && styles.next,
            ]}
          >
            <AppText variant="label" tone={step ? 'marca' : 'secundario'}>
              {String(index + 1)}
            </AppText>
            {step?.emoji ? (
              <AppText variant="title">{step.emoji}</AppText>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  slot: {
    flex: 1,
    maxWidth: sizes.sequenceSlot + spacing.md,
    minHeight: sizes.sequenceSlot,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    borderWidth: sizes.borderStrong,
  },
  filled: {
    backgroundColor: colors.verde.suave,
    borderColor: colors.verde.oscuro,
  },
  empty: {
    backgroundColor: colors.superficie.blanca,
    borderColor: colors.borde.suave,
  },
  next: {
    borderColor: colors.marca.naranja,
    borderStyle: 'dashed',
  },
});
