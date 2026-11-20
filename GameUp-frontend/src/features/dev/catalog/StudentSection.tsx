import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui';
import { GameCard } from '@/components/gameup';
import type { LevelUp } from '@/data/types';
import { LevelUpCelebration } from '@/features/games/components/LevelUpCelebration';
import { TaskCard } from '@/features/games/components/TaskCard';
import { HomeShortcut } from '@/features/home/components/HomeShortcut';
import { ResumeCard } from '@/features/home/components/ResumeCard';
import { TaskHeroCard } from '@/features/home/components/TaskHeroCard';
import { colors, radii, spacing } from '@/theme';
import { CatalogLabel, CatalogSection } from './CatalogSection';

const noop = () => {};
const sampleLevelUp: LevelUp = {
  gameId: 'memory',
  previousLevel: 2,
  level: 3,
  completed: false,
};

/** Piezas de las pantallas del niño, sobre el gris de la guía. */
export function StudentSection() {
  const [levelUp, setLevelUp] = useState<LevelUp | null>(null);

  return (
    <CatalogSection
      title="Pantallas del estudiante"
      note="Fondo gris de la guía con nubes o colinas. El color de cada juego va solo detrás de su dibujo; las tarjetas y botones usan los colores de ASISCO UP. Las estrellas de nivel llevan contorno oscuro para verse en cualquier fondo."
    >
      <View style={styles.stage}>
        <CatalogLabel>
          Inicio: aviso de la tarea y «Sigue donde ibas»
        </CatalogLabel>
        <TaskHeroCard gameTitle="Memoria" game="memory" onStart={noop} />
        <TaskHeroCard gameTitle="Emparejar" game="match" again onStart={noop} />
        <ResumeCard gameTitle="Habla conmigo" vowel="o" onContinue={noop} />
        <HomeShortcut
          icon="game"
          title="Juegos"
          subtitle="6 juegos"
          onPress={noop}
        />

        <CatalogLabel>Jugar por niveles</CatalogLabel>
        <View style={styles.row}>
          <GameCard
            title="Emparejar"
            subtitle="Une las parejas"
            icon="match"
            game="match"
            tone="surface"
            level={2}
            onPress={noop}
          />
          <GameCard
            title="Clasificar"
            subtitle="Cada uno a su grupo"
            icon="classify"
            game="classify"
            tone="surface"
            level={4}
            onPress={noop}
          />
        </View>

        <CatalogLabel>Tareas de mi profe</CatalogLabel>
        <TaskCard
          caption="Secuenciar"
          title="Lavarse las manos"
          icon="sequence"
          game="sequence"
          badge="Nueva"
          onPress={noop}
        />
      </View>

      <Button
        label="Ver la celebración de nivel"
        variant="secondary"
        icon="star"
        onPress={() => setLevelUp(sampleLevelUp)}
      />
      <LevelUpCelebration levelUp={levelUp} onClose={() => setLevelUp(null)} />
    </CatalogSection>
  );
}

const styles = StyleSheet.create({
  stage: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: colors.marca.gris,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
