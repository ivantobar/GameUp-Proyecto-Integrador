import * as Speech from 'expo-speech';

/**
 * Narración provisional con la voz del teléfono (expo-speech). Cuando la
 * fundación grabe las narraciones, se reemplaza esta implementación sin
 * cambiar los componentes que la usan.
 *
 * Nota: en iPhone no suena si el teléfono está en modo silencio.
 */
export interface Narrator {
  speak(text: string): void;
  stop(): void;
}

/** Español de Colombia; si el teléfono no tiene esa voz, español general. */
const PREFERRED_LANGUAGE = 'es-CO';
const FALLBACK_LANGUAGE = 'es';
/** Un poco más lento que lo normal, para que se entienda mejor. */
const RATE = 0.85;

export const expoSpeechNarrator: Narrator = {
  speak(text) {
    Speech.stop();
    Speech.speak(text, {
      language: PREFERRED_LANGUAGE,
      rate: RATE,
      onError: () => {
        Speech.speak(text, { language: FALLBACK_LANGUAGE, rate: RATE });
      },
    });
  },
  stop() {
    Speech.stop();
  },
};
