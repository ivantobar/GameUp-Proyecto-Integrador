import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Screen } from '@/components/ui';
import { Character, VideoPlaceholder } from '@/components/gameup';
import { useNarration } from '@/features/narration/useNarration';
import { PracticeHeader } from '@/features/speak/components/PracticeHeader';
import { parseVowel, vowelContent } from '@/features/speak/vowelContent';
import { spacing } from '@/theme';

/** Pantalla 4 · Paso 1 «Mira»: letra, boca del personaje y apoyos. */
export default function LookStep() {
  const params = useLocalSearchParams<{ vowel: string }>();
  const vowel = parseVowel(params.vowel);
  const { hint, mouth } = vowelContent[vowel];
  const letter = vowel.toUpperCase();
  const { narrate } = useNarration();
  const [showGesture, setShowGesture] = useState(false);

  return (
    <Screen
      tone="white"
      header={
        <PracticeHeader
          step={0}
          narration={`Mira. Esta es la ${letter}. ${hint}. Después toca Ahora tú.`}
        />
      }
      footer={
        <Button
          label="Ahora tú"
          size="large"
          onPress={() =>
            router.push({
              pathname: '/student/speak/[vowel]/say',
              params: { vowel },
            })
          }
        />
      }
    >
      <View
        style={styles.letters}
        accessible
        accessibilityLabel={`Letra ${letter}`}
      >
        <AppText variant="glyphLarge">{letter}</AppText>
        <AppText variant="glyph" tone="marca">
          {vowel}
        </AppText>
      </View>

      <View style={styles.center}>
        <Character
          mouth={mouth}
          size="lg"
          accessibilityLabel={`El personaje hace la boca de la ${letter}`}
        />
      </View>

      <AppText tone="secundario" style={styles.hint}>
        {hint}
      </AppText>

      <View style={styles.row}>
        <View style={styles.flex}>
          <Button
            label="Oír el sonido"
            icon="ear"
            variant="soft"
            onPress={() => narrate(vowel)}
          />
        </View>
        <View style={styles.flex}>
          <Button
            label="Ver el gesto"
            icon="hand"
            variant="warm"
            accessibilityHint="Muestra el video del gesto"
            onPress={() => setShowGesture((value) => !value)}
          />
        </View>
      </View>

      {showGesture ? (
        <VideoPlaceholder
          description={`Aquí verás a la terapeuta haciendo el gesto de la ${letter}`}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  letters: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  center: {
    alignItems: 'center',
  },
  hint: {
    textAlign: 'center',
  },
  // Si los dos botones no caben lado a lado (pantalla angosta o letra
  // grande del teléfono), el segundo baja y ambos ocupan todo el ancho.
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  flex: {
    flexGrow: 1,
  },
});
