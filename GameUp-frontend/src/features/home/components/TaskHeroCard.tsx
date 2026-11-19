import { StyleSheet, View } from 'react-native';
import { AppText, Badge, Button, Card } from '@/components/ui';
import { GameIcon, gameThemes } from '@/components/gameup';
import { EnterStagger } from '@/components/gameup/motion';
import { useLargeText } from '@/features/accessibility/useLargeText';
import type { GameId } from '@/data/types';
import { colors, radii, sizes, spacing } from '@/theme';

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
 * niño, grande y con un solo botón. El dibujo del juego va en un recuadro
 * blanco con el color del juego, para reconocerlo sin leer. El botón es
 * naranja porque está sobre verde oscuro (la misma excepción que
 * «Continuar»). Entra con un desplazamiento corto al abrir el Inicio.
 */
export function TaskHeroCard({
  gameTitle,
  game,
  again = false,
  onStart,
}: TaskHeroCardProps) {
  const largeText = useLargeText();
  const caption = again
    ? 'Tu profe quiere que lo practiques otra vez'
    : 'Tu profe te dejó';
  return (
    <EnterStagger index={0}>
      <Card tone="brand" style={styles.card}>
        <View style={largeText ? styles.stacked : styles.row}>
          <View
            style={[styles.iconFrame, { borderColor: gameThemes[game].accent }]}
          >
            <GameIcon game={game} size="lg" />
          </View>
          <View style={largeText ? styles.stackedTexts : styles.texts}>
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
            {again ? <Badge label="Otra vez" /> : null}
          </View>
        </View>
        <Button
          label="¡Vamos!"
          variant="accent"
          size="large"
          accessibilityHint={`Abre la tarea ${gameTitle}`}
          onPress={onStart}
        />
      </Card>
    </EnterStagger>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  /** Letra grande: el dibujo arriba y el texto debajo, a todo el ancho. */
  stacked: {
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stackedTexts: {
    alignSelf: 'stretch',
    gap: spacing.xxs,
  },
  /** Si no cabe, el texto baja debajo del dibujo (flexWrap). */
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconFrame: {
    padding: spacing.xxs,
    borderRadius: radii.xl,
    borderWidth: sizes.borderStrong + 1,
    backgroundColor: colors.superficie.blanca,
  },
  texts: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: sizes.textColumnMin,
    gap: spacing.xxs,
  },
});
