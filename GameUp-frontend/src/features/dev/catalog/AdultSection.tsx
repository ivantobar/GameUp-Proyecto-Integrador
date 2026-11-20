import { StyleSheet, View } from 'react-native';
import { AdultSurfaces, AppText, Button, PressableCard } from '@/components/ui';
import { Illustration } from '@/components/gameup';
import { TeacherNoteCard } from '@/features/home-practice/components/TeacherNoteCard';
import { WeekSoundCard } from '@/features/home-practice/components/WeekSoundCard';
import { WeekStreak } from '@/features/home-practice/components/WeekStreak';
import { spacing } from '@/theme';
import { CatalogLabel, CatalogSection } from './CatalogSection';

const noop = () => {};
const week = [
  { date: '2026-11-02', practiced: true },
  { date: '2026-11-03', practiced: false },
  { date: '2026-11-04', practiced: true },
  { date: '2026-11-05', practiced: false },
  { date: '2026-11-06', practiced: false },
  { date: '2026-11-07', practiced: false },
  { date: '2026-11-08', practiced: false },
];

/** Login, tallerista, directora y acudiente: sobrio, relieve discreto. */
export function AdultSection() {
  return (
    <CatalogSection
      title="Pantallas de adultos"
      note="Mismos colores de la guía, relieve más bajo (2 y 3 dp en lugar de 3 y 5) y sin rebote. Lo aplica AdultSurfaces en el login y en los espacios de la tallerista, la directora y el acudiente."
    >
      <CatalogLabel>Niño (arriba) y adulto (abajo)</CatalogLabel>
      <Button label="Botón del niño" onPress={noop} />
      <AdultSurfaces>
        <View style={styles.stack}>
          <Button label="Botón de adulto" onPress={noop} />
          <PressableCard accessibilityLabel="Tarjeta de adulto" onPress={noop}>
            <AppText variant="bodyStrong">Tarjeta de adulto</AppText>
          </PressableCard>

          <CatalogLabel>Acudiente: sonido de la semana y racha</CatalogLabel>
          <WeekSoundCard studentName="Luna M." firstName="Luna" vowel="a" />
          <WeekStreak days={week} />
          <TeacherNoteCard
            note={{ text: 'Practiquen frente al espejo.', audioUri: null }}
          />

          <CatalogLabel>Estados vacíos</CatalogLabel>
          <View style={styles.row}>
            <Illustration name="inboxDone" size="md" />
            <Illustration name="people" size="md" />
            <Illustration name="box" size="md" />
          </View>
        </View>
      </AdultSurfaces>
    </CatalogSection>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
});
