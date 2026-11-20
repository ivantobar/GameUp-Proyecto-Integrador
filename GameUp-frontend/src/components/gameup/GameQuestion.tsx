import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import type { GameId } from '@/data/types';
import { spacing } from '@/theme';
import { GameIconFrame } from './GameIconFrame';

interface GameQuestionProps {
  game: GameId;
  /** Pregunta corta de la ronda: «¿Qué boca hace este sonido?». */
  question: string;
}

/**
 * Pregunta de una ronda con el dibujo del juego al lado, sobre su fondo
 * suave (`GameIconFrame`): así el niño reconoce el juego sin leer. El dibujo es
 * decorativo; la pregunta es el título de la pantalla. Con letra grande,
 * la pregunta baja de línea junto al dibujo.
 */
export function GameQuestion({ game, question }: GameQuestionProps) {
  return (
    <View style={styles.row}>
      <GameIconFrame game={game} />
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
  text: {
    flexShrink: 1,
  },
});
