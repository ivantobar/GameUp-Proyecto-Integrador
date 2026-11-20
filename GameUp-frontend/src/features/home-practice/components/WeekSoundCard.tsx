import { StyleSheet, View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import type { Vowel } from '@/data/types';
import { colors, radii, sizes, spacing } from '@/theme';

interface WeekSoundCardProps {
  studentName: string;
  /** «Luna» (el nombre corto que se muestra). */
  firstName: string;
  vowel: Vowel | null;
}

/**
 * «Practicar en casa»: el sonido de la semana bien visible (la letra en
 * grande) y para quién es. Sin sonido asignado, lo dice igual de claro.
 */
export function WeekSoundCard({
  studentName,
  firstName,
  vowel,
}: WeekSoundCardProps) {
  return (
    <Card tone="brand">
      <View
        style={styles.row}
        accessible
        accessibilityRole="header"
        accessibilityLabel={
          vowel
            ? `${studentName}. Esta semana practican el sonido ${vowel}.`
            : `${studentName}. Esta semana no hay un sonido asignado.`
        }
      >
        {vowel ? (
          <View style={styles.letter}>
            <AppText variant="glyph" tone="marca">
              {vowel.toUpperCase()}
            </AppText>
          </View>
        ) : null}
        <View style={styles.texts}>
          <AppText variant="label" tone="sobreOscuro">
            Esta semana
          </AppText>
          <AppText variant="bodyStrong" tone="sobreOscuro">
            {vowel
              ? `${firstName} · esta semana: sonido ${vowel.toUpperCase()}`
              : `${firstName} · esta semana: sin sonido asignado`}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  /** Con letra grande, el texto baja debajo de la letra (flexWrap). */
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
  },
  letter: {
    minWidth: sizes.soundTile,
    minHeight: sizes.soundTile,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.xl,
    backgroundColor: colors.superficie.blanca,
  },
  texts: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: sizes.textColumnMin,
    gap: spacing.xxs,
  },
});
