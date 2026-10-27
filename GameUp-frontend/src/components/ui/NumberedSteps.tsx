import { StyleSheet, View } from 'react-native';
import { colors, radii, sizes, spacing } from '@/theme';
import { AppText } from './AppText';

interface NumberedStepsProps {
  steps: readonly string[];
}

/** Pasos numerados («Así lo practican»). */
export function NumberedSteps({ steps }: NumberedStepsProps) {
  return (
    <View style={styles.list} accessibilityRole="list">
      {steps.map((step, index) => (
        <View
          key={step}
          style={styles.row}
          accessible
          accessibilityLabel={`Paso ${index + 1}: ${step}`}
        >
          <View style={styles.number}>
            <AppText variant="bodyStrong" tone="cafe">
              {String(index + 1)}
            </AppText>
          </View>
          <AppText style={styles.text}>{step}</AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  number: {
    width: sizes.stepNumber,
    height: sizes.stepNumber,
    borderRadius: radii.pill,
    backgroundColor: colors.naranja.suave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
});
