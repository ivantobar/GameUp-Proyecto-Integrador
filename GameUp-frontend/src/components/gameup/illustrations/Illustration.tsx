import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg from 'react-native-svg';
import { sizes, type IllustrationSize } from '@/theme';
import { contentDrawings, type ContentIllustration } from './contentDrawings';
import { sceneDrawings, type SceneIllustration } from './sceneDrawings';

export type IllustrationName = ContentIllustration | SceneIllustration;

const drawings: Record<IllustrationName, ReactNode> = {
  ...contentDrawings,
  ...sceneDrawings,
};

/** Todos los nombres, para el catálogo y las pruebas. */
export const illustrationNames = Object.keys(drawings) as IllustrationName[];

interface IllustrationProps {
  name: IllustrationName;
  /** Tamaño del tema o un lado en dp (p. ej. el de la imagen de una tarjeta). */
  size?: IllustrationSize | number;
  /**
   * Descripción para el lector de pantalla. Sin ella el dibujo es
   * decorativo (lo habitual: el texto de al lado ya dice lo mismo).
   */
  accessibilityLabel?: string;
}

/** Un dibujo de la biblioteca propia de GameUP (SVG, caja de 100 × 100). */
export function Illustration({
  name,
  size = 'sm',
  accessibilityLabel,
}: IllustrationProps) {
  const side = typeof size === 'number' ? size : sizes.illustration[size];
  const decorative = accessibilityLabel === undefined;
  return (
    <View
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}
      accessibilityElementsHidden={decorative}
      testID={`illustration-${name}`}
    >
      <Svg width={side} height={side} viewBox="0 0 100 100">
        {drawings[name]}
      </Svg>
    </View>
  );
}
