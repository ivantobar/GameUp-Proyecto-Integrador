import { Animated, Pressable, StyleSheet } from 'react-native';
import { colors, radii, sizes, spacing } from '@/theme';
import { AppText } from './AppText';
import { Icon } from './Icon';
import type { PressableBaseProps } from './types';
import { pressColor, usePressFeedback } from './usePressFeedback';

interface FilterChipProps extends PressableBaseProps {
  label: string;
  selected: boolean;
}

/**
 * Chip de filtro («Todas», «Habla conmigo»…).
 * Seleccionado: verde oscuro, texto blanco y ✓ (el estado no depende solo
 * del color).
 */
export function FilterChip({
  label,
  selected,
  onPress,
  disabled = false,
  accessibilityHint,
  testID,
}: FilterChipProps) {
  const { progress, onPressIn, onPressOut } = usePressFeedback();
  const background = selected
    ? colors.verde.oscuro
    : pressColor(progress, colors.superficie.blanca, colors.verde.suave);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected, disabled }}
      testID={testID}
    >
      <Animated.View
        style={[
          styles.base,
          {
            backgroundColor: background,
            borderColor: selected ? colors.verde.oscuro : colors.borde.suave,
          },
        ]}
      >
        {selected ? (
          <Icon name="check" size="sm" color={colors.texto.sobreOscuro} />
        ) : null}
        <AppText
          variant="bodyStrong"
          tone={selected ? 'sobreOscuro' : 'principal'}
        >
          {label}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    minHeight: sizes.touchMin,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: sizes.border,
  },
});
