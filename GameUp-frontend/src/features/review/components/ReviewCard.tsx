import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  IconButton,
  InitialsAvatar,
} from '@/components/ui';
import type { ReviewItem } from '@/data/types';
import { spacing } from '@/theme';
import { reviewSummary } from '../reviewText';
import { FeedbackForm } from './FeedbackForm';
import { ReviewEvidence } from './ReviewEvidence';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';

type Panel = 'decide' | 'feedback' | 'voiceNote';

interface ReviewCardProps {
  item: ReviewItem;
  /** Solo una tarjeta abierta a la vez (la pantalla lo controla). */
  expanded: boolean;
  onExpand: () => void;
  /** Hay una acción guardándose para esta tarjeta. */
  busy: boolean;
  onValidate: () => void;
  onRequestMore: (feedback: string) => Promise<boolean>;
  onSaveVoiceNote: (audioUri: string) => Promise<boolean>;
  /** Fecha de referencia para «hoy»/«ayer» (en las pruebas). */
  now?: Date;
}

/**
 * Tarjeta de «Por escuchar». Cerrada: nombre, juego y fecha, con un botón
 * para abrirla. Abierta: el modelo y la grabación, y la decisión del
 * docente («Lo logró» o «Practicar más»).
 */
export function ReviewCard({
  item,
  expanded,
  onExpand,
  busy,
  onValidate,
  onRequestMore,
  onSaveVoiceNote,
  now,
}: ReviewCardProps) {
  const name = item.student.displayName;
  return (
    <Card>
      <View style={styles.header}>
        <InitialsAvatar initials={item.student.initials} />
        <View style={styles.texts}>
          <AppText variant="bodyStrong">{name}</AppText>
          <AppText variant="support" tone="secundario">
            {reviewSummary(item, now)}
          </AppText>
        </View>
        {expanded ? null : (
          <IconButton
            icon="play"
            variant="soft"
            accessibilityLabel={`Revisar la actividad de ${name}`}
            onPress={onExpand}
          />
        )}
      </View>
      {expanded ? (
        <ReviewCardBody
          item={item}
          busy={busy}
          onValidate={onValidate}
          onRequestMore={onRequestMore}
          onSaveVoiceNote={onSaveVoiceNote}
        />
      ) : null}
    </Card>
  );
}

type BodyProps = Pick<
  ReviewCardProps,
  'item' | 'busy' | 'onValidate' | 'onRequestMore' | 'onSaveVoiceNote'
>;

/** Parte abierta. Al cerrarse la tarjeta se desmonta y vuelve a «decidir». */
function ReviewCardBody({
  item,
  busy,
  onValidate,
  onRequestMore,
  onSaveVoiceNote,
}: BodyProps) {
  const [panel, setPanel] = useState<Panel>('decide');
  const name = item.student.displayName;

  const closeOnSuccess = async (action: Promise<boolean>) => {
    if (await action) setPanel('decide');
    return true;
  };

  return (
    <View style={styles.body}>
      <ReviewEvidence item={item} />

      {panel === 'decide' ? (
        <>
          <View style={styles.actions}>
            <View style={styles.action}>
              <Button
                label="Lo logró"
                icon="check"
                loading={busy}
                accessibilityHint="Valida la actividad. Cuenta para su progreso."
                onPress={onValidate}
              />
            </View>
            <View style={styles.action}>
              <Button
                label="Practicar más"
                icon="replay"
                variant="secondary"
                disabled={busy}
                accessibilityHint="Pide repetirla y deja una indicación."
                onPress={() => setPanel('feedback')}
              />
            </View>
          </View>
          <Button
            label="Dejar una nota de voz para la familia"
            icon="mic"
            variant="link"
            disabled={busy}
            onPress={() => setPanel('voiceNote')}
          />
        </>
      ) : null}

      {panel === 'feedback' ? (
        <FeedbackForm
          studentName={name}
          busy={busy}
          onSubmit={(feedback) => closeOnSuccess(onRequestMore(feedback))}
          onCancel={() => setPanel('decide')}
        />
      ) : null}

      {panel === 'voiceNote' ? (
        <VoiceNoteRecorder
          studentName={name}
          busy={busy}
          onSave={(audioUri) => closeOnSuccess(onSaveVoiceNote(audioUri))}
          onCancel={() => setPanel('decide')}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  texts: {
    flex: 1,
    gap: spacing.xxs,
  },
  body: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  action: {
    flex: 1,
  },
});
