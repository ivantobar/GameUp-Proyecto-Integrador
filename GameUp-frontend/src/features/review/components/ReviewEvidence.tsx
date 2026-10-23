import { StyleSheet, View } from 'react-native';
import { AudioClipRow } from '@/components/gameup';
import { AppText, Notice } from '@/components/ui';
import { firstName } from '@/data/studentName';
import type { ReviewItem } from '@/data/types';
import { useAttemptPlayback } from '@/features/speak/useAttemptPlayback';
import { colors, radii, spacing } from '@/theme';

interface SpeechEvidenceProps {
  studentName: string;
  speech: NonNullable<ReviewItem['speech']>;
}

/**
 * «Habla conmigo»: el modelo y la grabación del niño, uno debajo del otro,
 * para compararlos. La app no califica la pronunciación (regla 8): decide
 * el docente.
 */
function SpeechEvidence({ studentName, speech }: SpeechEvidenceProps) {
  const { playModel, playAttempt, attemptPlaying } = useAttemptPlayback(
    speech.vowel,
    speech.audioUri,
  );
  const attemptLabel = `${firstName(studentName)} · intento ${speech.attemptNumber} de ${speech.attemptsTotal}`;

  return (
    <View style={styles.list}>
      <AudioClipRow kind="model" label="Modelo" onPlay={playModel} />
      {speech.audioUri ? (
        <AudioClipRow
          kind="attempt"
          label={attemptLabel}
          onPlay={playAttempt}
          playing={attemptPlaying}
        />
      ) : (
        <Notice
          tone="warm"
          icon={speech.voiceConsent ? 'info' : 'mic'}
          title={`${attemptLabel} · sin grabación`}
          message={noAudioMessage(speech.voiceConsent)}
        />
      )}
    </View>
  );
}

/** Por qué no hay audio. Sin autorización, nunca se graba (regla 9). */
export function noAudioMessage(voiceConsent: boolean): string {
  return voiceConsent
    ? 'Dato de ejemplo, sin audio. Lo que se grabe en «Dilo» se escucha aquí.'
    : 'El acudiente no autorizó grabar la voz. Escúchalo en la próxima sesión.';
}

interface ListeningEvidenceProps {
  listening: NonNullable<ReviewItem['listening']>;
}

/** «Busca la boca»: cuántas vocales reconoció sin ayuda. */
function ListeningEvidence({ listening }: ListeningEvidenceProps) {
  return (
    <View style={styles.result}>
      <AppText variant="bodyStrong">
        Reconoció {listening.firstTryCorrect} de {listening.total} vocales al
        primer intento.
      </AppText>
      <AppText variant="support" tone="secundario">
        Las demás las encontró con la pista de la boca.
      </AppText>
    </View>
  );
}

interface ReviewEvidenceProps {
  item: ReviewItem;
}

/** Lo que el docente revisa antes de decidir. */
export function ReviewEvidence({ item }: ReviewEvidenceProps) {
  if (item.kind === 'speech' && item.speech) {
    return (
      <SpeechEvidence
        studentName={item.student.displayName}
        speech={item.speech}
      />
    );
  }
  if (item.kind === 'listening' && item.listening) {
    return <ListeningEvidence listening={item.listening} />;
  }
  return null;
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.xs,
  },
  result: {
    gap: spacing.xxs,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.verde.suave,
  },
});
