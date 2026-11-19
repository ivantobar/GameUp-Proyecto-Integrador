import { StyleSheet, View } from 'react-native';
import type { GameId } from '@/data/types';
import { radii, spacing, type GameIconSize } from '@/theme';
import { GameIcon } from './GameIcon';
import { gameThemes } from './gameThemes';

interface GameIconFrameProps {
  game: GameId;
  size?: GameIconSize;
}

/**
 * El dibujo de un juego sobre su fondo suave de identidad. Es el ÚNICO
 * lugar donde va el color de identidad del juego (regla de la guía): así
 * el niño reconoce el juego sin leer, y botones, textos y estados siguen
 * con los colores de ASISCO UP. Es decorativo.
 */
export function GameIconFrame({ game, size = 'sm' }: GameIconFrameProps) {
  return (
    <View
      style={[styles.frame, { backgroundColor: gameThemes[game].background }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <GameIcon game={game} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    padding: spacing.xxs,
    borderRadius: radii.lg,
  },
});
