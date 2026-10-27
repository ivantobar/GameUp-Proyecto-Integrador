import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radii, sizes, spacing } from '@/theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export interface BottomTabItem<K extends string> {
  key: K;
  label: string;
  icon: IconName;
}

interface BottomTabBarProps<K extends string> {
  items: readonly BottomTabItem<K>[];
  activeKey: K;
  onSelect: (key: K) => void;
}

/**
 * Barra inferior del estudiante (Inicio, Juegos, Progreso).
 * Es solo presentación: el layout de pestañas de Expo Router le pasa la
 * pestaña activa y qué hacer al tocar. La activa lleva fondo de píldora
 * (forma) además de color.
 */
export function BottomTabBar<K extends string>({
  items,
  activeKey,
  onSelect,
}: BottomTabBarProps<K>) {
  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {items.map((item) => {
        const selected = item.key === activeKey;
        return (
          <Pressable
            key={item.key}
            onPress={() => onSelect(item.key)}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected }}
            style={[styles.item, selected && styles.selected]}
          >
            <Icon
              name={item.icon}
              color={selected ? colors.verde.oscuro : colors.texto.secundario}
            />
            <AppText
              variant="bodyStrong"
              tone={selected ? 'principal' : 'secundario'}
            >
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.superficie.blanca,
    borderRadius: radii.xxl,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  item: {
    flex: 1,
    minHeight: sizes.tabBarItem,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.xl,
  },
  selected: {
    backgroundColor: colors.verde.suave,
  },
});
