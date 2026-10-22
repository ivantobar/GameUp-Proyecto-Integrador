import { useCallback } from 'react';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Notice, Screen } from '@/components/ui';
import { MicButton, MirrorView, Waveform } from '@/components/gameup';
import { PracticeHeader } from '@/features/speak/components/PracticeHeader';
import type { PracticeOutcome } from '@/features/speak/completePractice';
import { usePracticeSession } from '@/features/speak/PracticeSession';
import { useSayStep } from '@/features/speak/useSayStep';
import { parseVowel, vowelContent } from '@/features/speak/vowelContent';
import { spacing } from '@/theme';

/** Pantalla 5 · Paso 2 «Dilo»: espejo, micrófono y onda de voz. */
export default function SayStep() {
  const params = useLocalSearchParams<{ vowel: string }>();
  const vowel = parseVowel(params.vowel);
  const letter = vowel.toUpperCase();
  const focused = useIsFocused();
  const { setOutcome } = usePracticeSession();

  const onDone = useCallback(
    (outcome: PracticeOutcome) => {
      setOutcome(outcome);
      // «Listo» reemplaza a «Dilo»: al volver atrás se llega a «Mira».
      router.replace({
        pathname: '/student/speak/[vowel]/done',
        params: { vowel },
      });
    },
    [setOutcome, vowel],
  );

  const { consentLoading, canRecord, phase, level, toggleRecording, finish } =
    useSayStep(vowel, onDone);
  const recording = phase === 'recording';
  const saving = phase === 'saving';

  const narration = canRecord
    ? `Ahora tú. Mírate en el espejo y di la ${letter}. Toca el micrófono para empezar y otra vez cuando termines.`
    : `Ahora tú. Mírate en el espejo y di la ${letter} en voz alta. Después toca Ya lo dije.`;

  return (
    <Screen
      tone="white"
      header={<PracticeHeader step={1} narration={narration} />}
      footer={
        <Button
          label="Ver otra vez cómo se hace"
          icon="replay"
          variant="link"
          onPress={() => router.back()}
        />
      }
    >
      <AppText variant="title" accessibilityRole="header" style={styles.center}>
        Ahora tú: di la {letter}
      </AppText>

      <MirrorView mouth={vowelContent[vowel].mouth} active={focused} />

      <View style={styles.voice} accessibilityLiveRegion="polite">
        {canRecord ? (
          <>
            <MicButton
              recording={recording}
              disabled={saving || consentLoading}
              onPress={() => {
                toggleRecording().catch(() => {});
              }}
            />
            <Waveform tone="brand" active={recording} level={level} />
            <AppText variant="bodyStrong" style={styles.center}>
              {recording
                ? 'Te escucho… toca cuando termines'
                : saving
                  ? 'Guardando…'
                  : 'Toca el micrófono y dilo'}
            </AppText>
          </>
        ) : (
          <>
            <AppText style={styles.center}>
              Dilo en voz alta mirándote en el espejo.
            </AppText>
            <Button
              label="Ya lo dije"
              size="large"
              loading={saving}
              disabled={consentLoading}
              onPress={() => {
                finish().catch(() => {});
              }}
            />
          </>
        )}

        {phase === 'error' ? (
          <Notice
            icon="replay"
            tone="warm"
            message="Vamos a intentarlo otra vez."
            action={
              <Button
                label="Intentar de nuevo"
                variant="secondary"
                onPress={() => {
                  finish().catch(() => {});
                }}
              />
            }
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  voice: {
    alignItems: 'center',
    gap: spacing.sm,
  },
});
