import { StyleSheet, View } from 'react-native';
import { AppText, Badge, Button, Card } from '@/components/ui';
import { GameIcon } from '@/components/gameup';
import type { GameId } from '@/data/types';
import { spacing } from '@/theme';

interface TaskHeroCardProps {
  gameTitle: string;
  /** Juego de la tarea: se ve su dibujo a color. */
  game: GameId;
  /** La profe pidió practicarla otra vez (no es nueva). */
  again?: boolean;
  onStart: () => void;
}

/**
 * Inicio · «Haz esta tarea»: la tarea de la profe es lo primero que ve el
 * niño, grande y con un solo botón. El botón es naranja porque está sobre
 * verde oscuro (la misma excepción que «Continuar»).
 */
export function TaskHeroCard({
  gameTitle,
  game,
  again = false,
  onStart,
}: TaskHeroCardProps) {
  const caption = again
    ? 'Tu profe quiere que lo practiques otra vez'
    : 'Tu profe te dejó';
  return (
    <Card tone="brand">
      <View style={styles.row}>
        <View style={styles.texts}>
          <AppText
            variant="label"
            tone="sobreOscuro"
            accessibilityRole="header"
          >
            Haz esta tarea
          </AppText>
          <AppText variant="title" tone="sobreOscuro">
            {gameTitle}
          </AppText>
          <AppText tone="sobreOscuro">{caption}</AppText>
        </View>
        <GameIcon game={game} size="md" />
      </View>
      {again ? (
        <View style={styles.badge}>
          <Badge label="Otra vez" />
        </View>
      ) : null}
      <Button
        label="¡Vamos!"
        variant="accent"
        size="large"
        accessibilityHint={`Abre la tarea ${gameTitle}`}
        onPress={onStart}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  texts: {
    flex: 1,
    gap: spacing.xxs,
  },
  badge: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
});
