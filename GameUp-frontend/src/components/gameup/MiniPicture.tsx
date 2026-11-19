import { Image, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui';
import type { PictureFace } from '@/data/types';
import { radii, sizes } from '@/theme';
import { Illustration, illustrationFor, visibleText } from './illustrations';

interface MiniPictureProps {
  face: PictureFace;
  size?: keyof typeof sizes.miniPicture;
}

/**
 * Miniatura de una tarjeta ya acomodada (en un grupo o en una casilla), con
 * la misma prioridad que `Pictogram`: imagen de la fundación, dibujo exacto
 * o, si no hay, la palabra. Es decorativa: el contenedor lee la lista.
 */
export function MiniPicture({ face, size = 'sm' }: MiniPictureProps) {
  const side = sizes.miniPicture[size];
  if (face.imageUri) {
    return (
      <Image
        source={{ uri: face.imageUri }}
        style={[styles.image, { width: side, height: side }]}
        resizeMode="contain"
        accessible={false}
        testID="mini-picture-image"
      />
    );
  }
  const drawing = illustrationFor(face);
  if (drawing) return <Illustration name={drawing} size={side} />;
  return (
    <AppText variant="support" style={styles.word}>
      {visibleText(face) ?? face.label}
    </AppText>
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: radii.sm,
  },
  word: {
    textAlign: 'center',
  },
});
