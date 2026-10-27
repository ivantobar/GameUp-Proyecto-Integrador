import type { MouthShape } from '@/components/gameup';
import { isVowel, type Vowel } from '@/data/types';

interface VowelContent {
  /** Indicación del paso «Mira». */
  hint: string;
  /** Boca del personaje para esta vocal. */
  mouth: MouthShape;
}

/**
 * Indicaciones del paso «Mira». La de la O sale del mockup; las demás son una
 * PROPUESTA y deben ser revisadas por la terapeuta de la fundación antes de
 * usarse con los niños.
 */
export const vowelContent: Record<Vowel, VowelContent> = {
  a: { hint: 'Abre bien la boca como el personaje', mouth: 'a' },
  e: { hint: 'Estira la boca y muestra los dientes', mouth: 'e' },
  i: { hint: 'Sonríe bien estirado como el personaje', mouth: 'i' },
  o: { hint: 'Redondea la boca como el personaje', mouth: 'o' },
  u: { hint: 'Junta los labios como para dar un beso', mouth: 'u' },
};

/** Lee la vocal de la ruta; si no es válida, usa la A. */
export function parseVowel(value: string | string[] | undefined): Vowel {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw !== undefined && isVowel(raw) ? raw : 'a';
}
