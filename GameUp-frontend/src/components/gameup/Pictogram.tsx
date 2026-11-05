import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import type { PictureFace } from '@/data/types';
import { radii, sizes, spacing, type TextVariant } from '@/theme';

export type PictogramSize = 'md' | 'lg';

const emojiVariant: Record<PictogramSize, TextVariant> = {
  md: 'glyph',
  lg: 'glyphLarge',
};

interface PictogramProps {
  face: PictureFace;
  size?: PictogramSize;
}

/** Números y letras sueltas, grandes; palabras, en tamaño título. */
function textVariant(text: string): TextVariant {
  return text.length <= 2 ? 'glyph' : 'title';
}

/**
 * Lo que muestra una tarjeta de juego: la imagen de la fundación (o, si no
 * hay, el dibujo provisional), repetida si es una cantidad; y la palabra o
 * el número. Si no hay nada que dibujar, se muestra la etiqueta. Es
 * decorativo: el elemento que lo contiene dice al lector de pantalla qué es
 * (`face.label`).
 */
export function Pictogram({ face, size = 'md' }: PictogramProps) {
  const count = Math.max(1, face.count ?? 1);
  const side = sizes.pictogramImage[size];
  const repeat = (render: (index: number) => ReactNode) =>
    Array.from({ length: count }, (_, index) => render(index));
  const fallbackText =
    !face.imageUri && !face.emoji && !face.text ? face.label : null;

  return (
    <View
      style={styles.wrap}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {face.imageUri
        ? repeat((index) => (
            <Image
              key={index}
              source={{ uri: face.imageUri }}
              style={[styles.image, { width: side, height: side }]}
              resizeMode="contain"
              accessible={false}
              testID="pictogram-image"
            />
          ))
        : face.emoji
          ? // Respaldo: dibujo provisional cuando no hay imagen.
            repeat((index) => (
              <AppText key={index} variant={emojiVariant[size]}>
                {face.emoji}
              </AppText>
            ))
          : null}
      {face.text ? (
        <AppText variant={textVariant(face.text)}>{face.text}</AppText>
      ) : null}
      {fallbackText ? (
        <AppText variant={textVariant(fallbackText)}>{fallbackText}</AppText>
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
  image: {
    borderRadius: radii.md,
  },
});
