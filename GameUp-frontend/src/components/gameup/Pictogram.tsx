import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import type { PictureFace } from '@/data/types';
import { radii, sizes, spacing, type TextVariant } from '@/theme';
import { Illustration, illustrationFor } from './illustrations';

export type PictogramSize = 'md' | 'lg';

interface PictogramProps {
  face: PictureFace;
  size?: PictogramSize;
}

/** Números y letras sueltas, grandes; palabras, en tamaño título. */
function textVariant(text: string): TextVariant {
  return text.length <= 2 ? 'glyph' : 'title';
}

/**
 * Lo que muestra una tarjeta de juego, en este orden:
 * 1. la imagen de la fundación (`imageUri`), si la hay;
 * 2. si no, el dibujo propio de GameUP que corresponde EXACTAMENTE a su
 *    emoji provisional o a su palabra (`illustrationFor`);
 * 3. si no hay coincidencia exacta, la palabra (nunca un dibujo parecido).
 * El dibujo se repite si es una cantidad; el número o la palabra de
 * `face.text` va al lado.
 *
 * Es decorativo: el elemento que lo contiene dice al lector de pantalla qué
 * es (`face.label`).
 */
export function Pictogram({ face, size = 'md' }: PictogramProps) {
  const count = Math.max(1, face.count ?? 1);
  const side = sizes.pictogramImage[size];
  const repeat = (render: (index: number) => ReactNode) =>
    Array.from({ length: count }, (_, index) => render(index));
  const drawing = face.imageUri ? null : illustrationFor(face);
  const fallbackText =
    !face.imageUri && !drawing && !face.text ? face.label : null;

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
        : drawing
          ? repeat((index) => (
              <Illustration key={index} name={drawing} size={side} />
            ))
          : null}
      {face.text ? (
        <AppText variant={textVariant(face.text)}>{face.text}</AppText>
      ) : null}
      {fallbackText ? (
        <AppText variant={textVariant(fallbackText)} style={styles.word}>
          {fallbackText}
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
  image: {
    borderRadius: radii.md,
  },
  /** Con letra grande, la palabra baja de línea en vez de salirse. */
  word: {
    flexShrink: 1,
    textAlign: 'center',
  },
});
