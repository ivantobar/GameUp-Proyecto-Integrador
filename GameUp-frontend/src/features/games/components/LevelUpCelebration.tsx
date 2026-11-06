import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button } from '@/components/ui';
import { Celebration, LevelStars } from '@/components/gameup';
import type { LevelUp } from '@/data/types';
import { colors, radii, spacing } from '@/theme';
import { findGame } from '../catalog';

/** Se cierra sola después de un momento (sin cuenta regresiva visible). */
export const CELEBRATION_MS = 3500;

interface LevelUpCelebrationProps {
  /** La subida que se celebra, o `null` para no mostrar nada. */
  levelUp: LevelUp | null;
  onClose: () => void;
}

/** «¡Subiste de nivel en Memoria!» o «¡Completaste Memoria!». */
export function celebrationText(levelUp: LevelUp): string {
  const game = findGame(levelUp.gameId).title;
  return levelUp.completed
    ? `¡Completaste ${game}!`
    : `¡Subiste de nivel en ${game}!`;
}

/**
 * Celebración al subir de nivel: solo visual y breve. Sin sonido, sin
 * cuenta regresiva y sin pedir nada: se cierra sola o con un toque.
 */
export function LevelUpCelebration({
  levelUp,
  onClose,
}: LevelUpCelebrationProps) {
  useEffect(() => {
    if (!levelUp) return undefined;
    const timer = setTimeout(onClose, CELEBRATION_MS);
    return () => clearTimeout(timer);
  }, [levelUp, onClose]);

  if (!levelUp) return null;
  const text = celebrationText(levelUp);

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel={text}
        accessibilityHint="Toca para seguir"
      >
        <View style={styles.card} accessibilityLiveRegion="polite">
          <Celebration width={260} height={150}>
            <LevelStars level={levelUp.level} size="lg" />
          </Celebration>
          <AppText variant="title" style={styles.center}>
            {text}
          </AppText>
          <Button label="¡Sí!" variant="accent" onPress={onClose} />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.superficie.velo,
  },
  card: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.verde.oscuro,
  },
  center: {
    textAlign: 'center',
    color: colors.superficie.blanca,
  },
});
