import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radii, sizes, spacing } from '@/theme';
import { AppText } from './AppText';

export interface SegmentedTabOption<T extends string> {
  value: T;
  label: string;
  /** Pestaña visible pero bloqueada (por ejemplo, fuera del MVP). */
  disabled?: boolean;
}

interface SegmentedTabsProps<T extends string> {
  options: readonly SegmentedTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Nombre del grupo para el lector de pantalla («Tipo de sonido»). */
  accessibilityLabel: string;
}

/**
 * Pestañas segmentadas: «Vocales / Sílabas / Palabras».
 * - Seleccionada: fondo verde oscuro y texto blanco (cambia la forma).
 * - Bloqueada: texto de apoyo y la palabra «Pronto» debajo.
 */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedTabsProps<T>) {
  return (
    <View
      style={styles.container}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const disabled = option.disabled === true;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            disabled={disabled}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityHint={disabled ? 'Disponible próximamente' : undefined}
            accessibilityState={{ selected, disabled }}
            style={[styles.tab, selected && styles.selected]}
          >
            <AppText
              variant="bodyStrong"
              tone={selected ? 'sobreOscuro' : 'secundario'}
              numberOfLines={1}
            >
              {option.label}
            </AppText>
            {disabled ? (
              <AppText variant="support" tone="secundario">
                Pronto
              </AppText>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.superficie.blanca,
    borderRadius: radii.pill,
    padding: spacing.xxs,
    gap: spacing.xxs,
  },
  tab: {
    flex: 1,
    minHeight: sizes.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xs,
  },
  selected: {
    backgroundColor: colors.verde.oscuro,
  },
});
