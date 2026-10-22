import { StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Svg, { Ellipse } from 'react-native-svg';
import { AppText, Button, Icon } from '@/components/ui';
import { colors, radii, sizes, spacing } from '@/theme';
import { Character } from './Character';
import type { MouthShape } from './mouthShapes';

interface MirrorViewProps {
  /** Boca que muestra la miniatura «Así». */
  mouth: MouthShape;
  /**
   * Encender la cámara solo cuando la pantalla está al frente: al salir se
   * desmonta y deja de usarse.
   */
  active: boolean;
}

/**
 * Espejo del paso «Dilo». La cámara frontal SOLO muestra la imagen en vivo:
 * no toma fotos, no graba video y no guarda nada (regla de negocio 10).
 * Si no hay permiso, el juego sigue igual, sin espejo.
 */
export function MirrorView({ mouth, active }: MirrorViewProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const granted = permission?.granted === true;

  return (
    <View
      style={styles.frame}
      accessible
      accessibilityLabel={
        granted
          ? 'Espejo: mírate, no se graba'
          : 'Espejo apagado. Puedes decirlo igual.'
      }
    >
      {granted && active ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="front"
          mode="picture"
          animateShutter={false}
        />
      ) : null}

      {/* Guía punteada para ubicar la cara */}
      <Svg
        style={StyleSheet.absoluteFill}
        viewBox="0 0 300 300"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Ellipse
          cx={150}
          cy={150}
          rx={75}
          ry={100}
          stroke={colors.verde.suave}
          strokeOpacity={0.6}
          strokeWidth={3}
          strokeDasharray="10 8"
          fill="none"
        />
      </Svg>

      {/* Miniatura «Así» */}
      <View style={styles.thumb}>
        <Character mouth={mouth} size="xs" halo={false} />
        <AppText variant="bodyStrong">Así</AppText>
      </View>

      {!granted ? (
        <View style={styles.offMessage}>
          <AppText tone="sobreOscuro" style={styles.center}>
            {permission?.canAskAgain === false
              ? 'El espejo está apagado. Puedes decirlo igual.'
              : 'Mírate en el espejo mientras lo dices.'}
          </AppText>
          {permission?.canAskAgain !== false ? (
            <Button
              label="Usar el espejo"
              icon="video"
              variant="secondary"
              onPress={() => {
                requestPermission().catch(() => {});
              }}
            />
          ) : null}
        </View>
      ) : null}

      <View style={styles.notice}>
        <Icon name="video" size="sm" color={colors.texto.sobreOscuro} />
        <AppText variant="support" tone="sobreOscuro">
          Espejo: mírate, no se graba
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: sizes.mirror,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.verde.profundo,
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: sizes.mirrorThumb,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRadius: radii.lg,
    backgroundColor: colors.superficie.blanca,
  },
  offMessage: {
    alignSelf: 'center',
    maxWidth: '62%',
    gap: spacing.sm,
  },
  center: {
    textAlign: 'center',
  },
  notice: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
    backgroundColor: colors.verde.oscuro,
  },
});
