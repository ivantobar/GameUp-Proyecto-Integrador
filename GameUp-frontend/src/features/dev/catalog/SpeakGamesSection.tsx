import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, ProgressDots } from '@/components/ui';
import {
  CelebrationHero,
  GameQuestion,
  gameThemes,
  MicButton,
  MouthOption,
  StepIndicator,
  type MouthOptionState,
} from '@/components/gameup';
import { colors, radii, spacing } from '@/theme';
import { CatalogLabel, CatalogSection } from './CatalogSection';

const noop = () => {};
const states: readonly MouthOptionState[] = [
  'idle',
  'hint',
  'correct',
  'dimmed',
];

/** Habla conmigo y Busca la boca: pasos, micrófono, bocas y «¡Listo!». */
export function SpeakGamesSection() {
  const [recording, setRecording] = useState(false);
  // Cambiar la `key` vuelve a montar la celebración para verla otra vez.
  const [celebration, setCelebration] = useState(0);

  return (
    <CatalogSection
      title="Juegos de habla"
      note="Busca la boca usa la misma tarjeta con relieve, «respiración» y manito que los juegos de pensar. Los puntos de avance cumplen 3:1 sobre todos los fondos."
    >
      <CatalogLabel>
        Pasos de Habla conmigo (bajan de línea con letra grande)
      </CatalogLabel>
      <View style={styles.stage}>
        <StepIndicator steps={['Mira', 'Dilo', 'Listo']} current={1} />
      </View>

      <CatalogLabel>Micrófono de «Dilo» (toca para grabar)</CatalogLabel>
      <View style={[styles.stage, styles.center]}>
        <MicButton
          recording={recording}
          onPress={() => setRecording((value) => !value)}
        />
      </View>

      <CatalogLabel>Busca la boca: pregunta, avance y bocas</CatalogLabel>
      <View
        style={[
          styles.stage,
          { backgroundColor: gameThemes.findMouth.background },
        ]}
      >
        <ProgressDots total={4} current={1} />
        <GameQuestion game="findMouth" question="¿Qué boca hace este sonido?" />
        {states.map((state) => (
          <MouthOption key={state} vowel="o" state={state} onPress={noop} />
        ))}
      </View>

      <CatalogLabel>
        «¡Listo!»: personaje, confeti y estrellas una a una
      </CatalogLabel>
      <View style={[styles.stage, styles.brand]}>
        <CelebrationHero
          key={celebration}
          cheer="¡Muy bien, Lunita!"
          message="Dijiste la O"
          starsLabel="Tres estrellas por intentarlo"
        />
      </View>
      <Button
        label="Ver la celebración otra vez"
        variant="secondary"
        icon="replay"
        onPress={() => setCelebration((value) => value + 1)}
      />
    </CatalogSection>
  );
}

const styles = StyleSheet.create({
  stage: {
    gap: spacing.option,
    padding: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: colors.superficie.blanca,
  },
  center: {
    alignItems: 'center',
  },
  brand: {
    backgroundColor: colors.verde.oscuro,
  },
});
