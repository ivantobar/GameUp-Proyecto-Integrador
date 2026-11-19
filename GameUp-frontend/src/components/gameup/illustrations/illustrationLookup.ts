import type { PictureFace } from '@/data/types';
import type { ContentIllustration } from './contentDrawings';

/**
 * Diccionario de respaldo de `Pictogram`: qué dibujo propio va con cada
 * tarjeta cuando la fundación no subió una imagen.
 *
 * Regla: solo coincidencias EXACTAS. Si la palabra no está aquí, la tarjeta
 * muestra la palabra; nunca un dibujo «parecido» (un niño aprendiendo
 * vocabulario no debe ver un dibujo que no corresponde).
 *
 * Los datos (`src/data/**`) no se tocan: los emojis provisionales del
 * contenido de ejemplo se traducen aquí.
 */

/** Emoji provisional → dibujo. */
const byEmoji: Record<string, ContentIllustration> = {
  '🍎': 'manzana',
  '🍌': 'banano',
  '🍇': 'uvas',
  '🥕': 'zanahoria',
  '🍞': 'pan',
  '🐶': 'perro',
  '🐱': 'gato',
  '🐟': 'pez',
  '☀': 'sol',
  '🌙': 'luna',
  '☁': 'nube',
  '⭐': 'estrella',
  '🌸': 'flor',
  '🚗': 'carro',
  '⚽': 'balon',
  '🧦': 'medias',
  '🧢': 'gorra',
  '👕': 'camiseta',
  '🍽': 'plato',
  '🚰': 'grifo',
  '🧼': 'jabon',
  '👐': 'manos',
  '🧻': 'toalla',
  '🪥': 'cepillo',
  '😁': 'dientes',
  '🥛': 'vaso',
  '🔴': 'circuloRojo',
  '🔵': 'circuloAzul',
  '🟢': 'circuloVerde',
};

/**
 * Palabra (ya normalizada: minúsculas, sin tildes) → dibujo. Solo nombres de
 * cosas que el dibujo muestra tal cual. «llave» no está: en Colombia también
 * es la llave de la puerta.
 */
const byWord: Record<string, ContentIllustration> = {
  manzana: 'manzana',
  banano: 'banano',
  platano: 'banano',
  uvas: 'uvas',
  uva: 'uvas',
  zanahoria: 'zanahoria',
  pan: 'pan',
  perro: 'perro',
  gato: 'gato',
  pez: 'pez',
  sol: 'sol',
  luna: 'luna',
  nube: 'nube',
  estrella: 'estrella',
  flor: 'flor',
  carro: 'carro',
  balon: 'balon',
  pelota: 'balon',
  medias: 'medias',
  gorra: 'gorra',
  camiseta: 'camiseta',
  plato: 'plato',
  grifo: 'grifo',
  jabon: 'jabon',
  manos: 'manos',
  toalla: 'toalla',
  cepillo: 'cepillo',
  'cepillo de dientes': 'cepillo',
  dientes: 'dientes',
  vaso: 'vaso',
  rojo: 'circuloRojo',
  azul: 'circuloAzul',
  verde: 'circuloVerde',
  circulo: 'circulo',
  cuadrado: 'cuadrado',
  triangulo: 'triangulo',
};

/** Minúsculas, sin tildes y con un solo espacio entre palabras. */
export function normalizeWord(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** Quita el selector de variante (U+FE0F) que traen algunos emojis («☀️»). */
function normalizeEmoji(emoji: string): string {
  return emoji.replace(/️/g, '').trim();
}

/**
 * Dibujo propio para una tarjeta, o `null` si no hay coincidencia exacta
 * (entonces se muestra la palabra). Primero el emoji provisional; después
 * la etiqueta.
 */
export function illustrationFor(face: PictureFace): ContentIllustration | null {
  if (face.emoji) {
    const fromEmoji = byEmoji[normalizeEmoji(face.emoji)];
    if (fromEmoji) return fromEmoji;
  }
  return byWord[normalizeWord(face.label)] ?? null;
}
