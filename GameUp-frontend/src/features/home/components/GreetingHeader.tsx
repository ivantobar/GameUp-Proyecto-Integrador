import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { Character, NarrationButton } from '@/components/gameup';
import { spacing } from '@/theme';

interface GreetingHeaderProps {
  name: string;
  pendingCount: number;
  narration: string;
}

export function pendingGamesText(count: number): string {
  if (count === 0) return 'Hoy puedes jugar lo que quieras';
  return count === 1 ? 'Hoy tienes 1 juego' : `Hoy tienes ${count} juegos`;
}

/** Saludo con el personaje y el parlante (Inicio). */
export function GreetingHeader({
  name,
  pendingCount,
  narration,
}: GreetingHeaderProps) {
  return (
    <View style={styles.row}>
      <Character mouth="closed" size="xs" />
      <View style={styles.texts}>
        <AppText variant="title" accessibilityRole="header">
          ¡Hola, {name}!
        </AppText>
        <AppText tone="secundario">{pendingGamesText(pendingCount)}</AppText>
      </View>
      <NarrationButton text={narration} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  texts: {
    flex: 1,
  },
});
