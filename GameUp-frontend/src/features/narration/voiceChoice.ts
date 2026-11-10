/**
 * Reglas para que la voz del teléfono suene lo más natural posible:
 * escoger la mejor voz en español instalada y partir el texto en frases
 * cortas, con una pausa entre ellas, como habla una persona.
 *
 * Son funciones puras (sin expo-speech) para poder probarlas.
 */

/** Lo que expo-speech informa de cada voz instalada. */
export interface VoiceInfo {
  identifier: string;
  language: string;
  quality?: string;
}

/** Preferimos el acento más cercano a Colombia. */
const LANGUAGE_SCORE: Record<string, number> = {
  'es-co': 50,
  'es-us': 45,
  'es-mx': 45,
  'es-419': 45,
  'es-es': 20,
};
/** Cualquier otra variante de español (es-AR, es-CL, …). */
const OTHER_SPANISH_SCORE = 35;

function languageScore(language: string): number | null {
  const lang = language.toLowerCase().replace('_', '-');
  if (lang !== 'es' && !lang.startsWith('es-')) return null;
  return LANGUAGE_SCORE[lang] ?? OTHER_SPANISH_SCORE;
}

function qualityScore(voice: VoiceInfo): number {
  const id = voice.identifier.toLowerCase();
  let score = 0;
  // iPhone: las voces «premium» y «mejoradas» son las más humanas.
  if (id.includes('premium')) score += 100;
  else if (voice.quality === 'Enhanced' || id.includes('enhanced')) score += 80;
  // iPhone: voces de novedad (Eloquence, Grandma, Rocko…) suenan robóticas.
  if (id.includes('eloquence') || id.includes('speech.synthesis')) score -= 200;
  // Android: las voces «network» envían el texto a Google; preferimos las
  // que funcionan dentro del teléfono.
  if (id.includes('network')) score -= 30;
  return score;
}

/**
 * Devuelve el identificador de la mejor voz en español, o `undefined` si el
 * teléfono no tiene ninguna (entonces se usa la voz por defecto del idioma).
 */
export function pickBestVoice(voices: readonly VoiceInfo[]): string | undefined {
  let best: { id: string; score: number } | undefined;
  for (const voice of voices) {
    const lang = languageScore(voice.language);
    if (lang === null) continue;
    const score = lang + qualityScore(voice);
    if (!best || score > best.score) best = { id: voice.identifier, score };
  }
  return best?.id;
}

/**
 * Parte el texto en frases después de «.», «!», «?» o «…», sin perder los
 * signos. Las frases de una o dos palabras («¡Muy bien!») se mantienen solas
 * porque ahí la pausa ayuda a que se entienda.
 */
export function splitPhrases(text: string): string[] {
  const phrases = text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?…])\s+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  return phrases.map(normalizePhrase);
}

/**
 * Una vocal sola en mayúscula («A») a veces se lee «a mayúscula»; en
 * minúscula se pronuncia como sonido.
 */
function normalizePhrase(phrase: string): string {
  return /^[A-ZÁÉÍÓÚ]$/.test(phrase) ? phrase.toLowerCase() : phrase;
}
