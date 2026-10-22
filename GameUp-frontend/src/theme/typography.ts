import type { TextStyle } from 'react-native';

/**
 * Tipografía Nunito, según la guía de estilos.
 *
 * Con fuentes personalizadas, cada grosor es una familia distinta. Por eso
 * no se usa `fontWeight`: en Android puede hacer que se pierda la fuente.
 */
export const fontFamilies = {
  regular: 'Nunito_400Regular',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
} as const;

export type TextVariant =
  | 'display'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'bodyStrong'
  | 'button'
  | 'label'
  | 'support'
  | 'glyph'
  | 'glyphLarge';

/** Tamaño mínimo de texto de la guía. */
export const MIN_FONT_SIZE = 15;

export const typography: Record<TextVariant, TextStyle> = {
  /** Display 30/36 */
  display: { fontFamily: fontFamilies.extraBold, fontSize: 30, lineHeight: 36 },
  /** Título 24/30 */
  title: { fontFamily: fontFamilies.extraBold, fontSize: 24, lineHeight: 30 },
  /** Subtítulo 20/26 */
  subtitle: { fontFamily: fontFamilies.bold, fontSize: 20, lineHeight: 26 },
  /** Cuerpo 17/26 */
  body: { fontFamily: fontFamilies.regular, fontSize: 17, lineHeight: 26 },
  /** Cuerpo fuerte 17/26 */
  bodyStrong: { fontFamily: fontFamilies.bold, fontSize: 17, lineHeight: 26 },
  /** Botón 18/24 */
  button: { fontFamily: fontFamilies.bold, fontSize: 18, lineHeight: 24 },
  /**
   * Etiqueta: la guía dice 13/18, pero también fija un mínimo de 15 px.
   * El equipo decidió (22-oct-2026) usar 15/20 en GameUP.
   * Se escribe en minúsculas en el código y se muestra en MAYÚSCULAS con
   * `textTransform`, para que los lectores de pantalla no la deletreen.
   */
  label: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  /** Apoyo 15/22 */
  support: { fontFamily: fontFamilies.regular, fontSize: 15, lineHeight: 22 },
  /**
   * [derivado GameUP] Letra grande de las fichas de sonido (mockup 3).
   * La guía no define este tamaño; se toma del mockup.
   */
  glyph: { fontFamily: fontFamilies.extraBold, fontSize: 52, lineHeight: 60 },
  /** [derivado GameUP] Letra del paso «Mira» (mockup 4). */
  glyphLarge: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 96,
    lineHeight: 108,
  },
};
