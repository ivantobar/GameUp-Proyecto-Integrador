import { StyleSheet, View } from 'react-native';
import { AppText, IconButton } from '@/components/ui';
import { colors, radii, sizes, spacing, type ThemeColor } from '@/theme';
import { Waveform, type WaveformTone } from './Waveform';

export type AudioClipKind = 'model' | 'attempt' | 'note';

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
  /** Nota de voz de la profe para la familia (fondo blanco). */
  note: {
    background: colors.superficie.blanca,
    button: 'solid',
    wave: 'brand',
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
  /** Sin audio (por ejemplo, sin grabación): el botón se desactiva. */
  disabled?: boolean;
  /** Texto de apoyo debajo del título. */
  detail?: string;
}

/** Fila para escuchar un audio: botón ▶, título y onda decorativa. */
export function AudioClipRow({
  kind,
  label,
  onPlay,
  playing = false,
  disabled = false,
  detail,
}: AudioClipRowProps) {
  const config = kinds[kind];
  return (
    <View style={[styles.row, { backgroundColor: config.background }]}>
      <IconButton
        icon="play"
        variant={config.button}
        accessibilityLabel={`Escuchar: ${label}`}
        onPress={onPlay}
        disabled={disabled}
      />
      <View style={styles.texts}>
        <AppText variant="bodyStrong">{label}</AppText>
        {detail ? (
          <AppText variant="support" tone="secundario">
            {detail}
          </AppText>
        ) : null}
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
