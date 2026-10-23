import { StyleSheet, View } from 'react-native';
import { AudioClipRow } from '@/components/gameup';
import { AppText, Card, Icon } from '@/components/ui';
import type { TeacherNote } from '@/data/types';
import { useClipPlayer } from '@/features/audio/useClipPlayer';
import { colors, spacing } from '@/theme';

interface TeacherNoteCardProps {
  note: TeacherNote;
}

/** «Nota de la profe»: texto y, si la grabó, su nota de voz. */
export function TeacherNoteCard({ note }: TeacherNoteCardProps) {
  const player = useClipPlayer(note.audioUri);
  return (
    <Card tone="soft">
      <View style={styles.body}>
        <View style={styles.title}>
          <Icon name="note" color={colors.verde.oscuro} />
          <AppText variant="bodyStrong" tone="marca" accessibilityRole="header">
            Nota de la profe
          </AppText>
        </View>
        {note.text ? <AppText>{note.text}</AppText> : null}
        {player.available ? (
          <AudioClipRow
            kind="note"
            label="Nota de voz"
            onPlay={player.play}
            playing={player.playing}
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.sm,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
