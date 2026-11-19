import { StyleSheet, View } from 'react-native';
import { Icon, PressableSurface } from '@/components/ui';
import { colors, depth, radii, sizes } from '@/theme';

interface MicButtonProps {
  recording: boolean;
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Botón grande del micrófono (paso «Dilo»). Naranja con ícono oscuro.
 * Mientras graba, el halo se oscurece y el lector de pantalla dice que se
 * toca para terminar (el estado no se comunica solo con color).
 */
export function MicButton({
  recording,
  onPress,
  disabled = false,
}: MicButtonProps) {
  return (
    <View
      style={[
        styles.halo,
        {
          backgroundColor: recording
            ? colors.marca.naranja
            : colors.naranja.suave,
        },
      ]}
    >
      <PressableSurface
        colors={{
          background: colors.marca.naranja,
          pressedBackground: colors.naranja.presionado,
          // Grabando: borde oscuro (forma), además del halo naranja.
          border: recording ? colors.texto.principal : colors.marca.naranja,
          pressedBorder: recording
            ? colors.texto.principal
            : colors.naranja.presionado,
          edge: colors.relieve.naranja,
        }}
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel={recording ? 'Terminar de grabar' : 'Grabar mi voz'}
        accessibilityState={{ busy: recording }}
        depth="md"
        radius={radii.pill}
        borderWidth={sizes.borderStrong + 1}
        // Tamaño fijo: el botón y su relieve nunca se estiran.
        style={{ width: sizes.mic, height: sizes.mic + depth.md }}
        contentStyle={styles.button}
      >
        <Icon
          name={recording ? 'stop' : 'mic'}
          size="xl"
          color={colors.texto.principal}
        />
      </PressableSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  halo: {
    width: sizes.micHalo,
    height: sizes.micHalo,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: sizes.mic,
    height: sizes.mic,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
