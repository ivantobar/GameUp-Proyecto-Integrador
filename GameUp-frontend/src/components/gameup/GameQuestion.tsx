import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import type { GameId } from '@/data/types';
import { radii, sizes, spacing } from '@/theme';
import { GameIcon } from './GameIcon';
import { gameThemes } from './gameThemes';

interface GameQuestionProps {
  game: GameId;
  /** Pregunta corta de la ronda: «¿Qué boca hace este sonido?». */
  question: string;
}

/**
 * Pregunta de una ronda con el dibujo del juego al lado, enmarcado con el
 * acento del juego: así el niño reconoce el juego sin leer. El dibujo es
 * decorativo; la pregunta es el título de la pantalla. Con letra grande,
 * la pregunta baja de línea junto al dibujo.
 */
export function GameQuestion({ game, question }: GameQuestionProps) {
  return (
    <View style={styles.row}>
      <View
        style={[styles.frame, { borderColor: gameThemes[game].accent }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <GameIcon game={game} size="sm" />
      </View>
      <AppText variant="title" accessibilityRole="header" style={styles.text}>
        {question}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  frame: {
    borderWidth: sizes.borderStrong,
    borderRadius: radii.lg,
    padding: spacing.xxs,
  },
  text: {
    flexShrink: 1,
  },
});
