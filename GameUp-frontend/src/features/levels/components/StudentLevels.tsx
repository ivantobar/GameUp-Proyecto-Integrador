import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { LevelStars } from '@/components/gameup';
import { LADDER_LEVELS, type GameLevel } from '@/data/types';
import { findGame } from '@/features/games/catalog';
import { colors, radii, spacing } from '@/theme';
import { useStudentLevels } from '../useStudentLevels';

/** «Nivel 2», «Nivel 5 · ¡completado!» (para adultos). */
export function levelText(level: GameLevel): string {
  return level.completed
    ? `Nivel ${LADDER_LEVELS} · ¡completado!`
    : `Nivel ${level.level}`;
}

interface StudentLevelsProps {
  studentId: string;
  /** Título de la sección («Sus juegos»). */
  title?: string;
}

/**
 * Nivel de cada juego de un estudiante, para la profe y el acudiente.
 * Mientras carga no muestra nada; si falla, tampoco (no es imprescindible
 * para revisar ni para practicar en casa).
 */
export function StudentLevels({
  studentId,
  title = 'Sus juegos',
}: StudentLevelsProps) {
  const { resource } = useStudentLevels(studentId);
  if (resource.status !== 'ready' || resource.data.length === 0) return null;

  return (
    <View style={styles.box} testID="student-levels">
      <AppText variant="label" tone="secundario" accessibilityRole="header">
        {title}
      </AppText>
      {resource.data.map((level) => {
        const game = findGame(level.gameId).title;
        const text = levelText(level);
        return (
          <View
            key={level.gameId}
            style={styles.row}
            accessible
            accessibilityLabel={`${game}: ${text}`}
          >
            <AppText variant="bodyStrong" style={styles.game}>
              {game}
            </AppText>
            <LevelStars level={level.level} />
            <AppText variant="support" tone="secundario">
              {text}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.superficie.blanca,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  game: {
    minWidth: 96,
  },
});
