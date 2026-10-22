import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '@/components/ui';
import { colors, radii, sizes } from '@/theme';

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
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={recording ? 'Terminar de grabar' : 'Grabar mi voz'}
        accessibilityState={{ disabled, busy: recording }}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: pressed
              ? colors.naranja.presionado
              : colors.marca.naranja,
            borderColor: recording
              ? colors.texto.principal
              : colors.marca.naranja,
          },
        ]}
      >
        <Icon
          name={recording ? 'stop' : 'mic'}
          size="xl"
          color={colors.texto.principal}
        />
      </Pressable>
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
    borderRadius: radii.pill,
    borderWidth: sizes.borderStrong + 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
