import { StyleSheet, View } from 'react-native';
import { AppText, PressableSurface } from '@/components/ui';
import { HintPill, MiniPicture, Pictogram } from '@/components/gameup';
import { Breathe } from '@/components/gameup/motion';
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
  /** 3 grupos en la fila (niveles 4 y 5): grupo más bajo y dibujos más chicos. */
  compact?: boolean;
}

/**
 * Grupo de «Clasificar»: se toca para poner ahí el elemento de arriba.
 * Muestra los elementos que ya tiene. Con pista, borde punteado y
 * «Va aquí» (nunca se marca el otro grupo como incorrecto). Con la pista,
 * el grupo «respira» despacio dos veces; antes, nunca.
 */
export function CategoryBin({
  category,
  items,
  hint,
  disabled,
  onPress,
  compact = false,
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
    <Breathe active={hint} style={styles.flex}>
      <PressableSurface
        colors={{
          background: colors.superficie.blanca,
          pressedBackground: colors.verde.suave,
          border: hint ? colors.verde.oscuro : colors.borde.suave,
          pressedBorder: colors.verde.oscuro,
          edge: colors.relieve.superficie,
        }}
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel={label}
        depth="md"
        radius={radii.card}
        borderWidth={sizes.borderStrong + 1}
        borderStyle={hint ? 'dashed' : 'solid'}
        style={styles.flex}
        contentStyle={[styles.bin, compact && styles.compact]}
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
            <MiniPicture
              key={item.id}
              face={item}
              size={compact ? 'xs' : 'sm'}
            />
          ))}
        </View>
      </PressableSurface>
    </Breathe>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  bin: {
    minHeight: sizes.categoryBin,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  compact: {
    minHeight: sizes.pictureTile,
    padding: spacing.xs,
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
