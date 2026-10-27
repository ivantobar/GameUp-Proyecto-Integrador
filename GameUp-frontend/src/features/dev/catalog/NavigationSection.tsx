import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  BottomTabBar,
  FilterChip,
  HeaderBackButton,
  HeaderCloseButton,
  IconButton,
  ProgressBar,
  ProgressDots,
  ScreenHeader,
  SegmentedTabs,
  type BottomTabItem,
} from '@/components/ui';
import { useReducedMotion } from '@/features/motion/useReducedMotion';
import { spacing } from '@/theme';
import { CatalogLabel, CatalogSection } from './CatalogSection';

type SoundGroup = 'vowels' | 'syllables' | 'words';
type ReviewFilter = 'all' | 'speak' | 'findMouth';
type StudentTab = 'home' | 'games' | 'progress';

const studentTabs: readonly BottomTabItem<StudentTab>[] = [
  { key: 'home', label: 'Inicio', icon: 'home' },
  { key: 'games', label: 'Juegos', icon: 'game' },
  { key: 'progress', label: 'Progreso', icon: 'starOutline' },
];

const filters: readonly { value: ReviewFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'speak', label: 'Habla conmigo' },
  { value: 'findMouth', label: 'Busca la boca' },
];

const noop = () => {};

/** Encabezados, pestañas, filtros y barras de avance (interactivos). */
export function NavigationSection() {
  const [group, setGroup] = useState<SoundGroup>('vowels');
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [tab, setTab] = useState<StudentTab>('home');
  const [dot, setDot] = useState(1);
  const reducedMotion = useReducedMotion();

  return (
    <>
      <CatalogSection title="Encabezados">
        <ScreenHeader
          left={<HeaderBackButton onPress={noop} />}
          title="Juegos"
          right={
            <IconButton
              icon="speaker"
              variant="soft"
              accessibilityLabel="Oír la instrucción"
              onPress={noop}
            />
          }
        />
        <ScreenHeader
          left={<HeaderCloseButton onPress={noop} />}
          center={<ProgressDots total={5} current={dot} />}
          right={
            <IconButton
              icon="speaker"
              variant="soft"
              accessibilityLabel="Oír la instrucción"
              onPress={noop}
            />
          }
        />
      </CatalogSection>

      <CatalogSection
        title="Selección"
        note="«Sílabas» y «Palabras» están fuera del MVP: visibles pero bloqueadas."
      >
        <SegmentedTabs
          accessibilityLabel="Tipo de sonido"
          value={group}
          onChange={setGroup}
          options={[
            { value: 'vowels', label: 'Vocales' },
            { value: 'syllables', label: 'Sílabas', disabled: true },
            { value: 'words', label: 'Palabras', disabled: true },
          ]}
        />
        <CatalogLabel>Filtros</CatalogLabel>
        <View style={styles.row}>
          {filters.map((item) => (
            <FilterChip
              key={item.value}
              label={item.label}
              selected={filter === item.value}
              onPress={() => setFilter(item.value)}
            />
          ))}
        </View>
      </CatalogSection>

      <CatalogSection
        title="Avance"
        note="Naranja = estrellas de práctica. Verde = progreso oficial (solo actividades validadas)."
      >
        <ProgressBar
          tone="practice"
          value={3}
          max={5}
          label="Llevas 3 de 5 vocales"
        />
        <ProgressBar
          tone="official"
          value={2}
          max={5}
          label="Tu profe ya revisó 2 de 5"
        />
        <ProgressBar
          tone="official"
          value={0}
          max={5}
          label="Aún no hay actividades validadas"
        />
        <CatalogLabel>Puntos (toca para avanzar)</CatalogLabel>
        <View style={styles.row}>
          <ProgressDots total={5} current={dot} />
          <IconButton
            icon="forward"
            size="sm"
            accessibilityLabel="Siguiente punto"
            onPress={() => setDot((value) => (value + 1) % 5)}
          />
        </View>
      </CatalogSection>

      <CatalogSection title="Barra inferior">
        <BottomTabBar items={studentTabs} activeKey={tab} onSelect={setTab} />
      </CatalogSection>

      <CatalogSection title="Movimiento">
        <AppText>
          Reducir movimiento:{' '}
          {reducedMotion
            ? 'activado (fundido corto)'
            : 'desactivado (deslizar desde la derecha)'}
        </AppText>
      </CatalogSection>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
