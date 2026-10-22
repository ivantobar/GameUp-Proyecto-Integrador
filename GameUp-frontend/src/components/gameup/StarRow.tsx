import { StyleSheet, View } from 'react-native';
import { Icon } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { MAX_STARS, type StarCount } from '@/data/types';

interface StarRowProps {
  count: StarCount;
}

/**
 * Estrellas de práctica (premian el intento, no son una nota).
 * Llena y vacía tienen forma distinta, no solo otro color. Es decorativa:
 * el elemento que la contiene dice cuántas son.
 */
export function StarRow({ count }: StarRowProps) {
  return (
    <View
      style={styles.row}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: MAX_STARS }, (_, index) =>
        index < count ? (
          <Icon
            key={index}
            name="star"
            size="sm"
            color={colors.marca.naranja}
          />
        ) : (
          <Icon
            key={index}
            name="starOutline"
            size="sm"
            color={colors.estrella.vacia}
          />
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xxs,
  },
});
