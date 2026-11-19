import type { PictureFace } from '@/data/types';
import type { ContentIllustration } from './contentDrawings';

/**
 * Diccionario de respaldo de `Pictogram`: qué dibujo propio va con cada
 * tarjeta cuando la fundación no subió una imagen.
 *
 * Regla: solo coincidencias EXACTAS; nunca un dibujo «parecido» (un niño
 * aprendiendo vocabulario no debe ver un dibujo que no corresponde).
 *
 * Qué muestra una tarjeta (ver `Pictogram`), en este orden:
 * 1. la imagen de la fundación;
 * 2. el dibujo propio de su emoji (o, si no trae emoji ni texto, el de su
 *    palabra exacta);
 * 3. el emoji, en grande, como imagen: los niños no leen, y en «¿Qué
 *    palabra es?» la imagen de arriba no puede volverse palabra;
 * 4. solo si no hay nada de lo anterior, la palabra.
 * El emoji nunca aparece junto a un dibujo.
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
  '🥛': 'leche',
  '🔴': 'circuloRojo',
  '🔵': 'circuloAzul',
  '🟢': 'circuloVerde',
  '🍓': 'fresa',
  '🍐': 'pera',
  '🍉': 'sandia',
  '🐰': 'conejo',
  '🐑': 'oveja',
  '🐮': 'vaca',
  '🐷': 'cerdo',
  '🐻': 'oso',
  '🦁': 'leon',
  '🐒': 'mono',
  '🐘': 'elefante',
  '🐙': 'pulpo',
  '🐝': 'abeja',
  '✈': 'avion',
  '⛵': 'barco',
  '🚂': 'tren',
  '🚌': 'bus',
  '🚲': 'bicicleta',
  '🎈': 'globo',
  '🥄': 'cuchara',
  '🌊': 'mar',
  '💧': 'gota',
  '🟡': 'circuloAmarillo',
  '🙌': 'manos',
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
  fresa: 'fresa',
  pera: 'pera',
  sandia: 'sandia',
  conejo: 'conejo',
  oveja: 'oveja',
  vaca: 'vaca',
  cerdo: 'cerdo',
  oso: 'oso',
  leon: 'leon',
  mono: 'mono',
  elefante: 'elefante',
  pulpo: 'pulpo',
  abeja: 'abeja',
  avion: 'avion',
  barco: 'barco',
  tren: 'tren',
  bus: 'bus',
  bicicleta: 'bicicleta',
  globo: 'globo',
  cuchara: 'cuchara',
  mar: 'mar',
  gota: 'gota',
  amarillo: 'circuloAmarillo',
  leche: 'leche',
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
  return emoji.replace(/\uFE0F/g, '').trim();
}

/**
 * Rangos de los emojis que usa el contenido (pictogramas, símbolos,
 * dingbats, flechas y relojes). Se escriben a mano en lugar de usar
 * `\p{Extended_Pictographic}`: así no depende de que el motor de JavaScript
 * del teléfono (Hermes) soporte esa propiedad.
 */
const EMOJI_RANGES: readonly [number, number][] = [
  [0x1f000, 0x1faff],
  [0x2300, 0x23ff],
  [0x2600, 0x27bf],
  [0x2b00, 0x2bff],
];
/** Selector de variante y unión de emojis: acompañan, no cuentan. */
const EMOJI_JOINERS = new Set([0xfe0f, 0x200d]);

const isEmojiCodePoint = (code: number) =>
  EMOJI_RANGES.some(([from, to]) => code >= from && code <= to);

/**
 * ¿El texto es solo uno o varios emojis? («🍎», «☀️»). Las letras, los
 * números y las palabras («a», «3», «sol») no lo son.
 */
export function isEmojiOnly(text: string): boolean {
  let hasEmoji = false;
  for (const char of text.trim()) {
    const code = char.codePointAt(0) ?? 0;
    if (isEmojiCodePoint(code)) hasEmoji = true;
    else if (!EMOJI_JOINERS.has(code)) return false;
  }
  return hasEmoji;
}

/**
 * Emoji provisional de una tarjeta. El contenido de ejemplo lo trae en
 * `emoji`; el que siembra el backend, en `texto` (`face.text`). En los dos
 * casos solo sirve para elegir el dibujo: nunca se muestra.
 */
export function provisionalEmoji(face: PictureFace): string | undefined {
  if (face.emoji) return face.emoji;
  return face.text && isEmojiOnly(face.text) ? face.text : undefined;
}

/**
 * Texto que sí se escribe en la tarjeta (una letra, un número, una
 * palabra). Un emoji no se escribe nunca.
 */
export function visibleText(face: PictureFace): string | undefined {
  return face.text && !isEmojiOnly(face.text) ? face.text : undefined;
}

/**
 * Dibujo propio para una tarjeta, o `null` si no le corresponde ninguno.
 *
 * - Con emoji provisional (en `emoji` o en `texto`): el dibujo de ESE
 *   emoji. Si no hay, `null` y la tarjeta muestra el emoji en grande:
 *   nunca se busca un dibujo por la palabra (podría no ser el mismo).
 * - Con texto escrito (una palabra, un número): `null`. La tarjeta es para
 *   leer («¿Qué palabra es?»): un dibujo al lado regalaría la respuesta.
 * - Sin emoji ni texto: el dibujo de la palabra exacta de la etiqueta.
 */
export function illustrationFor(face: PictureFace): ContentIllustration | null {
  const emoji = provisionalEmoji(face);
  if (emoji) return byEmoji[normalizeEmoji(emoji)] ?? null;
  if (visibleText(face)) return null;
  return byWord[normalizeWord(face.label)] ?? null;
}
