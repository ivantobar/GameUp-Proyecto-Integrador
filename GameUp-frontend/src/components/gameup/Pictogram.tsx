import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import type { PictureFace } from '@/data/types';
import { radii, sizes, spacing, type TextVariant } from '@/theme';
import {
  Illustration,
  illustrationFor,
  provisionalEmoji,
  visibleText,
} from './illustrations';

export type PictogramSize = 'md' | 'lg';

/** Emoji de respaldo: del tamaño de un dibujo (glifo grande). */
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
 * Lo que muestra una tarjeta de juego, en este orden:
 * 1. la imagen de la fundación (`imageUri`), si la hay;
 * 2. si no, el dibujo propio de GameUP que le corresponde EXACTAMENTE
 *    (`illustrationFor`);
 * 3. si no hay dibujo pero trae emoji (en `emoji` o en `texto`, como lo
 *    siembra el backend), el emoji en grande, como imagen: los niños no
 *    leen, y en «¿Qué palabra es?» la tarjeta de arriba no puede volverse
 *    palabra;
 * 4. solo si no hay nada de lo anterior, la palabra.
 * La imagen se repite si es una cantidad. El número o la palabra escritos
 * en `texto` van al lado. El emoji nunca aparece junto a un dibujo.
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
  const emoji = face.imageUri || drawing ? undefined : provisionalEmoji(face);
  const text = visibleText(face);
  const fallbackText =
    !face.imageUri && !drawing && !emoji && !text ? face.label : null;

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
          : emoji
            ? // Respaldo: el emoji como imagen, cuando no hay dibujo propio.
              repeat((index) => (
                <AppText
                  key={index}
                  variant={emojiVariant[size]}
                  testID="pictogram-emoji"
                >
                  {emoji}
                </AppText>
              ))
            : null}
      {text ? <AppText variant={textVariant(text)}>{text}</AppText> : null}
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
