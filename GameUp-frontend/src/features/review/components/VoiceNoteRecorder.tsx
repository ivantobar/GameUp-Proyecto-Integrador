import { StyleSheet, View } from 'react-native';
import { AudioClipRow, Waveform } from '@/components/gameup';
import { AppText, Button, Notice } from '@/components/ui';
import { useClipPlayer } from '@/features/audio/useClipPlayer';
import { spacing } from '@/theme';
import { useVoiceNote } from '../useVoiceNote';

interface VoiceNoteRecorderProps {
  studentName: string;
  busy: boolean;
  onSave: (audioUri: string) => Promise<boolean>;
  onCancel: () => void;
}

/** Nota de voz del docente para la familia: grabar, escuchar y enviar. */
export function VoiceNoteRecorder({
  studentName,
  busy,
  onSave,
  onCancel,
}: VoiceNoteRecorderProps) {
  const note = useVoiceNote();
  const player = useClipPlayer(note.uri);

  if (note.denied) {
    return (
      <View style={styles.box}>
        <Notice
          icon="mic"
          title="Sin permiso de micrófono"
          message="Actívalo en los ajustes del teléfono para grabar la nota."
        />
        <Button label="Cerrar" variant="link" onPress={onCancel} />
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <AppText variant="bodyStrong">
        Nota de voz para la familia de {studentName}
      </AppText>

      {note.phase === 'recording' ? (
        <>
          <View
            accessible
            accessibilityLabel="Grabando tu nota de voz"
            accessibilityLiveRegion="polite"
          >
            <Waveform tone="brand" active level={note.level} />
          </View>
          <Button
            label="Detener"
            icon="stop"
            onPress={() => {
              note.stop().catch(() => {});
            }}
          />
        </>
      ) : null}

      {note.phase === 'recorded' && note.uri ? (
        <>
          <AudioClipRow
            kind="model"
            label="Tu nota"
            onPlay={player.play}
            playing={player.playing}
          />
          <Button
            label="Enviar a la familia"
            icon="check"
            loading={busy}
            onPress={() => {
              if (note.uri) onSave(note.uri).catch(() => {});
            }}
          />
          <Button
            label="Grabar otra vez"
            icon="replay"
            variant="secondary"
            onPress={() => {
              note.start().catch(() => {});
            }}
          />
        </>
      ) : null}

      {note.phase === 'idle' ? (
        <Button
          label="Grabar"
          icon="mic"
          onPress={() => {
            note.start().catch(() => {});
          }}
        />
      ) : null}

      <Button label="Cancelar" variant="link" onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: spacing.sm,
  },
});
