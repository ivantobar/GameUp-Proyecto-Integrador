import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import type { VowelPractice } from '@/data/types';
import { colors, radii, sizes, spacing } from '@/theme';
import {
  countPracticed,
  practiceLevel,
  vowelsDoneAccessibilityLabel,
  vowelsDoneLabel,
} from '../practice';

interface VowelsDoneMeterProps {
  /** Las 5 vocales en orden, con sus estrellas de práctica. */
  vowels: readonly VowelPractice[];
}

/**
 * «Vocales terminadas: 2 de 5» y un círculo por vocal con su letra. Una
 * vocal se termina con 3 estrellas. El estado se distingue por la forma,
 * no solo por el color: terminada = círculo lleno; si no, solo el borde.
 * El lector de pantalla lo lee como un solo elemento.
 */
export function VowelsDoneMeter({ vowels }: VowelsDoneMeterProps) {
  const done = countPracticed(vowels);
  const label = vowelsDoneAccessibilityLabel(vowels);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{
        min: 0,
        max: vowels.length,
        now: done,
        text: label,
      }}
      style={styles.container}
    >
      <AppText variant="bodyStrong">
        {vowelsDoneLabel(done, vowels.length)}
      </AppText>
      <View
        style={styles.row}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {vowels.map(({ vowel, stars }) => {
          const finished = practiceLevel(stars) === 'practiced';
          return (
            <View
              key={vowel}
              style={[styles.circle, finished ? styles.done : styles.pending]}
            >
              <AppText
                variant="bodyStrong"
                tone={finished ? 'sobreOscuro' : 'secundario'}
              >
                {vowel.toUpperCase()}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  /** Con letra grande, las vocales bajan de línea en vez de salirse. */
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  /** Tamaño mínimo (no fijo): con letra grande la vocal no se corta. */
  circle: {
    minWidth: sizes.vowelDone,
    minHeight: sizes.vowelDone,
    paddingHorizontal: spacing.xxs,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  done: {
    backgroundColor: colors.verde.oscuro,
  },
  /** Borde gris oscuro (5,6:1 o más): el círculo se ve (antes 1,4:1). */
  pending: {
    backgroundColor: colors.superficie.blanca,
    borderWidth: sizes.borderStrong,
    borderColor: colors.texto.secundario,
  },
});
