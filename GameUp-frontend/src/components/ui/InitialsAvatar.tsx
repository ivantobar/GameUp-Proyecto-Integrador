import { StyleSheet, View } from 'react-native';
import { colors, radii, sizes, spacing } from '@/theme';
import { AppText } from './AppText';

interface InitialsAvatarProps {
  /** Dos letras, por ejemplo «MC». */
  initials: string;
}

/**
 * Círculo con iniciales. Es decorativo: el nombre completo siempre está
 * escrito al lado, así que el lector de pantalla lo omite.
 */
export function InitialsAvatar({ initials }: InitialsAvatarProps) {
  return (
    <View
      style={styles.circle}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <AppText variant="bodyStrong" tone="marca">
        {initials.slice(0, 2).toUpperCase()}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Tamaño mínimo (no fijo): con letra grande las iniciales no se cortan. */
  circle: {
    minWidth: sizes.avatar,
    minHeight: sizes.avatar,
    paddingHorizontal: spacing.xxs,
    borderRadius: radii.pill,
    backgroundColor: colors.verde.suave,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
