import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import {
  gameThemes,
  PictureCard,
  type PictureCardState,
} from '@/components/gameup';
import { CategoryBin } from '@/features/classify/components/CategoryBin';
import { MemoryCard } from '@/features/memory/components/MemoryCard';
import { SequenceSlots } from '@/features/sequence/components/SequenceSlots';
import { radii, spacing, type ThemeColor } from '@/theme';
import { CatalogLabel, CatalogSection } from './CatalogSection';

const noop = () => {};
const apple = { id: 'manzana', label: 'manzana', emoji: '🍎' };
const states: readonly PictureCardState[] = [
  'idle',
  'hint',
  'correct',
  'dimmed',
];

function GameBackground({
  background,
  children,
}: {
  background: ThemeColor;
  children: ReactNode;
}) {
  return (
    <View style={[styles.stage, { backgroundColor: background }]}>
      {children}
    </View>
  );
}

/** Opciones de los juegos de pensar, en todos sus estados, sobre su fondo. */
export function ThinkingGamesSection() {
  return (
    <CatalogSection
      title="Juegos de pensar"
      note="Relieve plano que se hunde al tocar. La pista (borde punteado + manito que toca despacio) y el acierto «respiran» dos veces y paran; antes de la pista nada se mueve. Los estados usan siempre los verdes de la guía, nunca el color del juego."
    >
      <CatalogLabel>Emparejar: idle, pista, acierto, atenuada</CatalogLabel>
      <GameBackground background={gameThemes.match.background}>
        {states.map((state) => (
          <PictureCard key={state} face={apple} state={state} onPress={noop} />
        ))}
      </GameBackground>

      <CatalogLabel>
        Clasificar: grupo con pista y grupo con elementos
      </CatalogLabel>
      <GameBackground background={gameThemes.classify.background}>
        <View style={styles.row}>
          <CategoryBin
            category={{ id: 'frutas', label: 'Frutas', emoji: '🍎' }}
            items={[]}
            hint
            disabled={false}
            onPress={noop}
          />
          <CategoryBin
            category={{ id: 'animales', label: 'Animales', emoji: '🐶' }}
            items={[
              {
                id: 'gato',
                label: 'gato',
                emoji: '🐱',
                categoryId: 'animales',
              },
              { id: 'pez', label: 'pez', emoji: '🐟', categoryId: 'animales' },
            ]}
            hint={false}
            disabled={false}
            onPress={noop}
          />
        </View>
      </GameBackground>

      <CatalogLabel>Secuenciar: casillas</CatalogLabel>
      <GameBackground background={gameThemes.sequence.background}>
        <SequenceSlots
          total={3}
          placed={[{ id: 'llave', label: 'Abrir la llave', emoji: '🚰' }]}
        />
      </GameBackground>

      <CatalogLabel>
        Memoria: boca abajo, arriba, no es su pareja, pareja
      </CatalogLabel>
      <GameBackground background={gameThemes.memory.background}>
        <View style={styles.row}>
          <MemoryCard position={1} face={apple} view="down" onPress={noop} />
          <MemoryCard position={2} face={apple} view="up" onPress={noop} />
        </View>
        <View style={styles.row}>
          <MemoryCard
            position={3}
            face={apple}
            view="mismatch"
            onPress={noop}
          />
          <MemoryCard position={4} face={apple} view="matched" onPress={noop} />
        </View>
      </GameBackground>
      <AppText variant="support" tone="secundario">
        Para ver la entrada escalonada y el rebote del «¡Muy bien!», abre los
        juegos desde la cuenta del estudiante.
      </AppText>
    </CatalogSection>
  );
}

const styles = StyleSheet.create({
  stage: {
    gap: spacing.option,
    padding: spacing.md,
    borderRadius: radii.xl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.option,
  },
});
