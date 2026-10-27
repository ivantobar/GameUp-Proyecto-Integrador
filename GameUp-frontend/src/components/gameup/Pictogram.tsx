import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import type { PictureFace } from '@/data/types';
import { spacing, type TextVariant } from '@/theme';

export type PictogramSize = 'md' | 'lg';

const emojiVariant: Record<PictogramSize, TextVariant> = {
  md: 'glyph',
  lg: 'glyphLarge',
};

interface PictogramProps {
  face: PictureFace;
  size?: PictogramSize;
}

/**
 * Lo que muestra una tarjeta de juego: el dibujo (repetido si es una
 * cantidad) o la palabra o el número. Es decorativo: el elemento que lo
 * contiene dice al lector de pantalla qué es (`face.label`).
 */
export function Pictogram({ face, size = 'md' }: PictogramProps) {
  const count = Math.max(1, face.count ?? 1);
  return (
    <View
      style={styles.wrap}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {face.emoji
        ? Array.from({ length: count }, (_, index) => (
            <AppText key={index} variant={emojiVariant[size]}>
              {face.emoji}
            </AppText>
          ))
        : null}
      {face.text ? (
        // Números y letras sueltas, grandes; palabras, en tamaño título.
        <AppText variant={face.text.length <= 2 ? 'glyph' : 'title'}>
          {face.text}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
});
