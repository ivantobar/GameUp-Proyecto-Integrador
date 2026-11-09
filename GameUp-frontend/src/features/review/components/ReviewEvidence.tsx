import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { AudioClipRow } from '@/components/gameup';
import { AppText, Notice } from '@/components/ui';
import { firstName } from '@/data/studentName';
import type { NoAudioReason, ReviewItem } from '@/data/types';
import { useAttemptPlayback } from '@/features/speak/useAttemptPlayback';
import { colors, radii, spacing } from '@/theme';
import { useRemoteRecording } from '../useRemoteRecording';

type Speech = NonNullable<ReviewItem['speech']>;

interface SpeechEvidenceProps {
  studentName: string;
  speech: Speech;
  /** Pide el audio al servidor (si `speech.remoteAudio`). */
  loadRecording?: () => Promise<string>;
  /** Se llama una vez cuando el docente ya pidió y oyó la grabación. */
  onListened?: () => void;
}

/**
 * «Habla conmigo»: «Así debe sonar» (el modelo) y la voz del niño, uno
 * debajo del otro, para compararlos. La app no califica la pronunciación
 * (regla 8): decide el docente. Si el audio está en el servidor, se pide al tocar «Escuchar».
 */
function SpeechEvidence({
  studentName,
  speech,
  loadRecording,
  onListened,
}: SpeechEvidenceProps) {
  const local = useAttemptPlayback(speech.vowel, speech.audioUri);
  const remote = useRemoteRecording(
    speech.remoteAudio ? loadRecording : undefined,
  );
  const attemptText = `${firstName(studentName)} · intento ${speech.attemptNumber} de ${speech.attemptsTotal}`;
  // «Voz de Martín · intento 2 de 2», junto a «Así debe sonar».
  const attemptLabel = `Voz de ${attemptText}`;

  useEffect(() => {
    if (remote.listened) onListened?.();
  }, [remote.listened, onListened]);

  return (
    <View style={styles.list}>
      <AudioClipRow
        kind="model"
        label="Así debe sonar"
        onPlay={local.playModel}
      />
      {speech.audioUri ? (
        <AudioClipRow
          kind="attempt"
          label={attemptLabel}
          onPlay={local.playAttempt}
          playing={local.attemptPlaying}
        />
      ) : speech.remoteAudio ? (
        <>
          <AudioClipRow
            kind="attempt"
            label={attemptLabel}
            onPlay={() => {
              remote.play().catch(() => {});
            }}
            playing={remote.playing || remote.state === 'loading'}
          />
          {remote.state === 'error' ? (
            <Notice
              tone="warm"
              icon="offline"
              message="No pudimos traer la grabación. Revisa la conexión y tócala otra vez."
            />
          ) : null}
        </>
      ) : (
        <Notice
          tone="warm"
          icon={speech.voiceConsent ? 'info' : 'mic'}
          title={`${attemptText} · sin grabación`}
          message={noAudioText(speech)}
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

/**
 * Motivo preciso que da el backend. En todos estos casos el docente decide
 * sin escuchar: no hay nada que bloquee «Lo logró» ni «Practicar más».
 */
const NO_AUDIO_REASON: Record<NoAudioReason, string> = {
  noConsent: noAudioMessage(false),
  notVerified:
    'No se pudo verificar la autorización del acudiente, así que la voz no se grabó. Puedes decidir igual o escucharlo en la próxima sesión.',
  notSent:
    'Había autorización, pero no llegó la grabación (por ejemplo, el teléfono no dio permiso de micrófono). Puedes decidir igual.',
  notSaved:
    'La grabación no se pudo guardar en el servidor. Puedes decidir igual o escucharlo en la próxima sesión.',
};

export function noAudioText(speech: Speech): string {
  if (speech.audioExpired) {
    return 'La grabación se borró a los 30 días sin revisar. Puedes decidir igual o escucharlo en la próxima sesión.';
  }
  if (speech.noAudioReason) return NO_AUDIO_REASON[speech.noAudioReason];
  return noAudioMessage(speech.voiceConsent);
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

interface GameEvidenceProps {
  game: NonNullable<ReviewItem['game']>;
}

/**
 * Emparejar, Clasificar, Secuenciar y Memoria: lo que hizo, sin nota. Los
 * errores no restan: son información para decidir.
 */
function GameEvidence({ game }: GameEvidenceProps) {
  const { score } = game;
  const pending = game.pendingSameActivity ?? 1;
  return (
    <View style={styles.result}>
      <AppText variant="support" tone="secundario">
        {game.title}
      </AppText>
      {typeof game.level === 'number' ? (
        <AppText variant="support" tone="secundario">
          {pending > 1
            ? `Escalera: nivel ${game.level}. Jugó ${pending} veces este nivel; aprobar una lo sube.`
            : `Escalera: nivel ${game.level}. Si lo apruebas, sube de nivel.`}
        </AppText>
      ) : null}
      {score.kind === 'turns' ? (
        <>
          <AppText variant="bodyStrong">
            Resolvió {score.firstTryCorrect} de {score.total} al primer intento.
          </AppText>
          <AppText variant="support" tone="secundario">
            Los demás los resolvió con la pista.
          </AppText>
        </>
      ) : (
        <>
          <AppText variant="bodyStrong">
            Encontró las {score.pairs} parejas.
          </AppText>
          <AppText variant="support" tone="secundario">
            {score.mismatches === 0
              ? 'No abrió ninguna carta de más.'
              : score.mismatches === 1
                ? 'Abrió 1 vez dos cartas distintas.'
                : `Abrió ${score.mismatches} veces dos cartas distintas.`}
          </AppText>
        </>
      )}
    </View>
  );
}

interface ReviewEvidenceProps {
  item: ReviewItem;
  loadRecording?: () => Promise<string>;
  onListened?: () => void;
}

/** Lo que el docente revisa antes de decidir. */
export function ReviewEvidence({
  item,
  loadRecording,
  onListened,
}: ReviewEvidenceProps) {
  if (item.kind === 'speech' && item.speech) {
    return (
      <SpeechEvidence
        studentName={item.student.displayName}
        speech={item.speech}
        loadRecording={loadRecording}
        onListened={onListened}
      />
    );
  }
  if (item.kind === 'listening' && item.listening) {
    return <ListeningEvidence listening={item.listening} />;
  }
  if (item.kind === 'game' && item.game) {
    return <GameEvidence game={item.game} />;
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
