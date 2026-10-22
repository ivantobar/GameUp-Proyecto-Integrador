import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Card, FilterChip } from '@/components/ui';
import {
  Character,
  GameCard,
  Mouth,
  NarrationButton,
  SoundTile,
  type MouthShape,
} from '@/components/gameup';
import { VOWELS, type StarCount } from '@/data/types';
import { spacing } from '@/theme';
import { CatalogLabel, CatalogSection } from './CatalogSection';

const characterMouths: readonly MouthShape[] = [...VOWELS, 'closed', 'smile'];

const noop = () => {};

/** Personaje, bocas y componentes propios de GameUP. */
export function GameUpSection() {
  const [mouth, setMouth] = useState<MouthShape>('o');
  const [stars, setStars] = useState<StarCount>(1);

  return (
    <CatalogSection
      title="Personaje y bocas"
      note="Diseño original del equipo. No copia las láminas ni los gestos del Método Ventura."
    >
      <CatalogLabel>Bocas sueltas (Busca la boca)</CatalogLabel>
      <Card>
        <View style={styles.wrap}>
          {VOWELS.map((vowel) => (
            <View key={vowel} style={styles.mouthItem}>
              <Mouth vowel={vowel} />
              <AppText variant="bodyStrong">{vowel.toUpperCase()}</AppText>
            </View>
          ))}
        </View>
      </Card>

      <CatalogLabel>Personaje (toca una boca)</CatalogLabel>
      <Card>
        <View style={styles.center}>
          <Character mouth={mouth} size="lg" />
        </View>
        <View style={styles.wrap}>
          {characterMouths.map((shape) => (
            <FilterChip
              key={shape}
              label={shape}
              selected={shape === mouth}
              onPress={() => setMouth(shape)}
            />
          ))}
        </View>
        <View style={styles.wrap}>
          <Character mouth={mouth} size="xs" />
          <Character mouth={mouth} size="sm" />
          <Character mouth={mouth} size="md" />
          <Character mouth={mouth} size="md" halo={false} />
        </View>
      </Card>

      <CatalogLabel>Fichas de sonido (toca para sumar estrellas)</CatalogLabel>
      <View style={styles.wrap}>
        <SoundTile letter="O" stars={0} onPress={noop} />
        <SoundTile letter="O" stars={1} onPress={noop} />
        <SoundTile letter="O" stars={3} onPress={noop} />
        <SoundTile
          letter="A"
          stars={stars}
          onPress={() => setStars((value) => ((value + 1) % 4) as StarCount)}
        />
      </View>

      <CatalogLabel>Tarjetas de juego</CatalogLabel>
      <View style={styles.row}>
        <GameCard
          tone="brand"
          icon="mic"
          title="Habla conmigo"
          subtitle="Mira, oye y dilo"
          badge="Nuevo"
          onPress={noop}
        />
        <GameCard
          tone="warm"
          icon="ear"
          title="Busca la boca"
          subtitle="Oye y toca"
          badge="Tarea"
          onPress={noop}
        />
      </View>

      <CatalogLabel>Narración (expo-speech)</CatalogLabel>
      <View style={styles.row}>
        <NarrationButton text="Toca un sonido para practicar" />
        <AppText style={styles.flex}>
          Toca el parlante: debe leer «Toca un sonido para practicar».
        </AppText>
      </View>
    </CatalogSection>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  center: {
    alignItems: 'center',
  },
  mouthItem: {
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
});
