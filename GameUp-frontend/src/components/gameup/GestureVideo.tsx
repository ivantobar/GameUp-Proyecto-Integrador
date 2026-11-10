import { useCallback, useEffect, useState } from 'react';
import { useEvent, useEventListener } from 'expo';
import { useIsFocused } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Icon } from '@/components/ui';
import type { Vowel } from '@/data/types';
import { useNarration } from '@/features/narration/useNarration';
import { VIDEO_CREDIT, vowelVideos } from '@/features/speak/vowelVideos';
import { colors, radii, spacing } from '@/theme';

interface GestureVideoProps {
  vowel: Vowel;
  accessibilityLabel?: string;
  /**
   * Qué hacer si el video no abre (por ejemplo «Toca Oír el sonido.»).
   * Depende de la pantalla: no todas tienen ese botón.
   */
  fallbackHint?: string;
}

/**
 * Video del gesto de una vocal, grabado por doña Consuelo, terapeuta de la
 * Fundación ASISCO-UP. Su método de enseñanza se basa en el Método Ventura de
 * Patricia Ventura (ver `vowelVideos`).
 *
 * Se reproduce una sola vez al aparecer, con sonido y sin bucle. Al terminar
 * ofrece «Ver otra vez». Antes de cada reproducción calla al narrador para que
 * su voz no suene encima de la de la profe. Sin límites de tiempo ni sonidos
 * de error: si el video no abre, se muestra un aviso suave.
 *
 * Si la pantalla pierde el foco (por ejemplo «Mira» queda debajo de «Dilo»),
 * el video se pausa para no sonar mientras el niño graba.
 *
 * Para cambiar de vocal hay que volver a montarlo (`key={vowel}`): en SDK 58
 * `useVideoPlayer` no crea otro reproductor al cambiar la fuente, solo la
 * reemplaza, y el estado («Ver otra vez») quedaría del video anterior.
 */
export function GestureVideo({
  vowel,
  accessibilityLabel,
  fallbackHint,
}: GestureVideoProps) {
  const letter = vowel.toUpperCase();
  const { stop } = useNarration();
  const player = useVideoPlayer(vowelVideos[vowel], (p) => {
    p.loop = false;
  });
  const { status } = useEvent(player, 'statusChange', {
    status: player.status,
  });
  // «Ver otra vez» aparece cuando el video se detiene después de empezar:
  // porque terminó o porque se pausó al salir de la pantalla.
  const [stopped, setStopped] = useState(false);
  useEventListener(player, 'playToEnd', () => setStopped(true));
  useEventListener(player, 'playingChange', ({ isPlaying }) =>
    setStopped(!isPlaying),
  );

  // Una sola vez al montarse.
  useEffect(() => {
    stop();
    player.play();
  }, [player, stop]);

  // Al perder el foco, pausa. Al volver no sigue solo: queda «Ver otra vez».
  const focused = useIsFocused();
  useEffect(() => {
    if (!focused) player.pause();
  }, [focused, player]);

  const watchAgain = useCallback(() => {
    stop();
    setStopped(false);
    player.replay();
    player.play();
  }, [player, stop]);

  const failed = status === 'error';

  return (
    <View style={styles.panel}>
      {failed ? (
        <View
          style={[styles.video, styles.fallback]}
          accessible
          accessibilityLiveRegion="polite"
        >
          <Icon name="hand" size="xl" color={colors.texto.sobreOscuro} />
          <AppText tone="sobreOscuro" style={styles.center}>
            {fallbackHint
              ? `No pudimos abrir el video. ${fallbackHint}`
              : 'No pudimos abrir el video.'}
          </AppText>
        </View>
      ) : (
        <View
          style={styles.video}
          accessible
          accessibilityLabel={
            accessibilityLabel ??
            `La profe Consuelo hace el gesto de la ${letter}`
          }
        >
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            nativeControls={false}
          />
        </View>
      )}

      <View style={styles.footer}>
        {stopped && !failed ? (
          <Button
            label="Ver otra vez"
            icon="play"
            size="large"
            variant="warm"
            accessibilityLabel={`Ver otra vez el gesto de la ${letter}`}
            onPress={watchAgain}
          />
        ) : null}
        <AppText variant="support" tone="sobreOscuro" style={styles.center}>
          {VIDEO_CREDIT}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: '100%',
    borderRadius: radii.xl,
    backgroundColor: colors.verde.profundo,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radii.xl,
    backgroundColor: colors.verde.profundo,
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  footer: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  center: {
    textAlign: 'center',
  },
});
