import { StyleSheet, View } from 'react-native';
import { AppText, IconButton } from '@/components/ui';
import { colors, radii, sizes, spacing, type ThemeColor } from '@/theme';
import { Waveform, type WaveformTone } from './Waveform';

export type AudioClipKind = 'model' | 'attempt';

const kinds = {
  /** «Así suena»: el modelo, en verde. */
  model: {
    background: colors.verde.suave,
    button: 'solid',
    wave: 'brand',
  },
  /** «Así lo dijiste tú»: la voz del niño, en naranja. */
  attempt: {
    background: colors.naranja.suave,
    button: 'accent',
    wave: 'accent',
  },
} as const satisfies Record<
  AudioClipKind,
  {
    background: ThemeColor;
    button: 'solid' | 'accent';
    wave: WaveformTone;
  }
>;

interface AudioClipRowProps {
  kind: AudioClipKind;
  label: string;
  onPlay: () => void;
  playing?: boolean;
}

/** Fila para escuchar un audio: botón ▶, título y onda decorativa. */
export function AudioClipRow({
  kind,
  label,
  onPlay,
  playing = false,
}: AudioClipRowProps) {
  const config = kinds[kind];
  return (
    <View style={[styles.row, { backgroundColor: config.background }]}>
      <IconButton
        icon="play"
        variant={config.button}
        accessibilityLabel={`Escuchar: ${label}`}
        onPress={onPlay}
      />
      <View style={styles.texts}>
        <AppText variant="bodyStrong">{label}</AppText>
        <Waveform
          tone={config.wave}
          active={playing}
          height={sizes.waveformSmall}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xs,
    borderRadius: radii.lg,
  },
  texts: {
    flex: 1,
    gap: spacing.xxs,
  },
});
