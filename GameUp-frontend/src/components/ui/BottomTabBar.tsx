import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, motion, radii, sizes, spacing } from '@/theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { curves } from './motionCurves';

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
 * Barra inferior (estudiante, docente y directora).
 * Es solo presentación: el layout de pestañas de Expo Router le pasa la
 * pestaña activa y qué hacer al tocar. La activa lleva fondo de píldora y
 * una raya debajo del ícono (forma) además de color.
 */
export function BottomTabBar<K extends string>({
  items,
  activeKey,
  onSelect,
}: BottomTabBarProps<K>) {
  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {items.map((item) => (
        <TabItem
          key={item.key}
          item={item}
          selected={item.key === activeKey}
          onPress={() => onSelect(item.key)}
        />
      ))}
    </View>
  );
}

interface TabItemProps<K extends string> {
  item: BottomTabItem<K>;
  selected: boolean;
  onPress: () => void;
}

function TabItem<K extends string>({
  item,
  selected,
  onPress,
}: TabItemProps<K>) {
  // La píldora aparece con un fundido y un leve crecimiento (con «reducir
  // movimiento», Reanimated la muestra directo).
  const shown = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    shown.value = withTiming(selected ? 1 : 0, {
      duration: motion.duration.state,
      easing: curves.out,
    });
  }, [selected, shown]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ scaleX: interpolate(shown.value, [0, 1], [0.85, 1]) }],
  }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected }}
      style={styles.item}
    >
      <Animated.View style={[styles.pill, pillStyle]} />
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
      <View
        style={[
          styles.mark,
          {
            backgroundColor: selected
              ? colors.verde.oscuro
              : colors.transparente,
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.superficie.blanca,
    borderRadius: radii.xxl,
    borderWidth: sizes.border,
    borderColor: colors.borde.suave,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  item: {
    flex: 1,
    minHeight: sizes.tabBarItem,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxs,
  },
  pill: {
    ...StyleSheet.absoluteFill,
    borderRadius: radii.xl,
    backgroundColor: colors.verde.suave,
  },
  /** Raya de la pestaña activa: el estado también se ve por forma. */
  mark: {
    width: sizes.dotActiveWidth,
    height: sizes.tabMark,
    borderRadius: radii.pill,
    marginTop: spacing.xxs,
  },
});
