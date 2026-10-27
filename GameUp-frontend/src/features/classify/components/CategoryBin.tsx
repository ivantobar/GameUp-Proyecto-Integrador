import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { HintPill, Pictogram } from '@/components/gameup';
import type { ClassifyCategory, ClassifyItem } from '@/data/types';
import { colors, radii, sizes, spacing } from '@/theme';

interface CategoryBinProps {
  category: ClassifyCategory;
  /** Elementos que ya están en este grupo. */
  items: readonly ClassifyItem[];
  /** El niño se equivocó y este es el grupo correcto. */
  hint: boolean;
  /** Ronda resuelta o sin elemento por ubicar. */
  disabled: boolean;
  onPress: () => void;
}

/**
 * Grupo de «Clasificar»: se toca para poner ahí el elemento de arriba.
 * Muestra los elementos que ya tiene. Con pista, borde punteado y
 * «Va aquí» (nunca se marca el otro grupo como incorrecto).
 */
export function CategoryBin({
  category,
  items,
  hint,
  disabled,
  onPress,
}: CategoryBinProps) {
  const contents =
    items.length > 0
      ? `Tiene: ${items.map((item) => item.label).join(', ')}`
      : 'Vacío';
  const label = [
    `Grupo ${category.label}`,
    hint ? 'Pista: va aquí' : null,
    contents,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.bin,
        {
          backgroundColor:
            pressed && !disabled
              ? colors.verde.suave
              : colors.superficie.blanca,
          borderColor: hint ? colors.verde.oscuro : colors.borde.suave,
          borderStyle: hint ? 'dashed' : 'solid',
        },
      ]}
    >
      <View style={styles.title}>
        <Pictogram face={{ ...category, text: undefined }} />
        <AppText variant="bodyStrong" style={styles.center}>
          {category.label}
        </AppText>
      </View>
      {hint ? <HintPill kind="hint" label="Va aquí" /> : null}
      <View
        style={styles.items}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {items.map((item) => (
          <AppText key={item.id} variant="title">
            {item.emoji ?? item.label}
          </AppText>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bin: {
    flex: 1,
    minHeight: sizes.categoryBin,
    padding: spacing.sm,
    gap: spacing.xs,
    borderRadius: radii.xl,
    borderWidth: sizes.borderStrong + 1,
  },
  title: {
    alignItems: 'center',
    paddingBottom: spacing.xs,
    borderBottomWidth: sizes.border,
    borderBottomColor: colors.borde.suave,
  },
  center: {
    textAlign: 'center',
  },
  items: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
});
