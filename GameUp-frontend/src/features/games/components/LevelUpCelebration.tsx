import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button } from '@/components/ui';
import {
  Celebration,
  GameIcon,
  gameThemes,
  LevelStars,
} from '@/components/gameup';
import { PopIn } from '@/components/gameup/motion';
import type { LevelUp } from '@/data/types';
import { useScreenReaderEnabled } from '@/features/accessibility/useScreenReaderEnabled';
import { colors, radii, sizes, spacing } from '@/theme';
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
 *
 * Con TalkBack (o VoiceOver) encendido NO se cierra sola: el lector
 * necesita tiempo para leerla, y el niño la cierra con un toque.
 */
export function LevelUpCelebration({
  levelUp,
  onClose,
}: LevelUpCelebrationProps) {
  const screenReader = useScreenReaderEnabled();

  useEffect(() => {
    if (!levelUp || screenReader) return undefined;
    const timer = setTimeout(onClose, CELEBRATION_MS);
    return () => clearTimeout(timer);
  }, [levelUp, onClose, screenReader]);

  if (!levelUp) return null;
  const text = celebrationText(levelUp);

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={`${text} Toca la pantalla para seguir jugando.`}
      >
        {/* La tarjeta aparece con un rebote leve; el dibujo del juego dice
            cuál subió, y las estrellas del nivel salen una a una. */}
        <PopIn>
          <View style={styles.card} accessibilityLiveRegion="polite">
            <Celebration
              width={sizes.character.lg + 40}
              height={sizes.gameIcon.lg + spacing.xxl}
            >
              <View
                style={[
                  styles.iconFrame,
                  { borderColor: gameThemes[levelUp.gameId].accent },
                ]}
              >
                <GameIcon game={levelUp.gameId} size="lg" />
              </View>
            </Celebration>
            <LevelStars level={levelUp.level} size="lg" appear />
            <AppText variant="title" tone="sobreOscuro" style={styles.center}>
              {text}
            </AppText>
            <View style={styles.action}>
              <Button
                label="¡Sí!"
                variant="accent"
                size="large"
                onPress={onClose}
              />
            </View>
          </View>
        </PopIn>
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
    borderRadius: radii.card,
    backgroundColor: colors.verde.oscuro,
  },
  iconFrame: {
    padding: spacing.xxs,
    borderRadius: radii.xl,
    borderWidth: sizes.borderStrong + 1,
    backgroundColor: colors.superficie.blanca,
  },
  center: {
    textAlign: 'center',
  },
  /** El botón ocupa todo el ancho de la tarjeta (área táctil grande). */
  action: {
    alignSelf: 'stretch',
  },
});
