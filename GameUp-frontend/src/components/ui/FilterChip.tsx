import { StyleSheet } from 'react-native';
import { colors, radii, sizes, spacing } from '@/theme';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableSurface } from './PressableSurface';
import type { PressableBaseProps } from './types';

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
  return (
    <PressableSurface
      colors={
        selected
          ? {
              background: colors.verde.oscuro,
              pressedBackground: colors.verde.oscuro,
              border: colors.verde.oscuro,
              pressedBorder: colors.verde.oscuro,
              edge: colors.verde.profundo,
            }
          : {
              background: colors.superficie.blanca,
              pressedBackground: colors.verde.suave,
              border: colors.borde.suave,
              pressedBorder: colors.verde.oscuro,
              edge: colors.relieve.superficie,
            }
      }
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected }}
      testID={testID}
      depth="sm"
      radius={radii.pill}
      borderWidth={sizes.border}
      contentStyle={styles.base}
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
    </PressableSurface>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    minHeight: sizes.touchMin,
    paddingHorizontal: spacing.md,
  },
});
