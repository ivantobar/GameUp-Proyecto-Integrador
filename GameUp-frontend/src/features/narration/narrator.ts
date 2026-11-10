import * as Speech from 'expo-speech';
import { pickBestVoice, splitPhrases } from './voiceChoice';

/**
 * Narración con la voz del teléfono (expo-speech). Para que suene menos
 * robótica: usa la mejor voz en español instalada, un tono natural
 * y lee frase por frase con una pausa corta entre ellas.
 *
 * Todo ocurre dentro del teléfono: el texto no se envía a ningún servicio.
 * Cuando la fundación grabe las narraciones, se reemplaza esta implementación
 * sin cambiar los componentes que la usan.
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
/** Un poco más lento que lo normal, para que se entienda sin sonar arrastrado. */
const RATE = 0.9;
/** Tono natural de la voz: subirlo la hace sonar más artificial. */
const PITCH = 1.0;
/** Silencio entre frases, en milisegundos. */
const PAUSE_MS = 300;

let voicePromise: Promise<string | undefined> | null = null;

/**
 * Busca la mejor voz una sola vez. Si no encuentra ninguna (en Android la
 * lista puede llegar vacía al abrir la app), vuelve a buscar la próxima vez
 * y mientras tanto usa la voz por defecto del idioma.
 */
function bestVoice(): Promise<string | undefined> {
  voicePromise ??= Speech.getAvailableVoicesAsync()
    .then((voices) => {
      const voice = pickBestVoice(voices);
      if (!voice) voicePromise = null;
      return voice;
    })
    .catch(() => {
      voicePromise = null;
      return undefined;
    });
  return voicePromise;
}

export function createExpoSpeechNarrator(): Narrator {
  /** Cada lectura nueva invalida la anterior (y sus pausas pendientes). */
  let turn = 0;
  let pause: ReturnType<typeof setTimeout> | null = null;

  function cancelPending() {
    turn += 1;
    if (pause) clearTimeout(pause);
    pause = null;
  }

  function speakPhrases(
    phrases: string[],
    index: number,
    myTurn: number,
    voice: string | undefined,
  ) {
    if (myTurn !== turn || index >= phrases.length) return;
    const next = () => {
      if (myTurn !== turn) return;
      pause = setTimeout(
        () => speakPhrases(phrases, index + 1, myTurn, voice),
        PAUSE_MS,
      );
    };
    Speech.speak(phrases[index], {
      language: PREFERRED_LANGUAGE,
      voice,
      rate: RATE,
      pitch: PITCH,
      onDone: next,
      onError: () => {
        // Si la voz elegida falla, se intenta con la voz por defecto.
        Speech.speak(phrases[index], {
          language: FALLBACK_LANGUAGE,
          rate: RATE,
          pitch: PITCH,
          onDone: next,
        });
      },
    });
  }

  return {
    speak(text) {
      cancelPending();
      Speech.stop();
      const myTurn = turn;
      const phrases = splitPhrases(text);
      if (phrases.length === 0) return;
      void bestVoice().then((voice) =>
        speakPhrases(phrases, 0, myTurn, voice),
      );
    },
    stop() {
      cancelPending();
      Speech.stop();
    },
  };
}

export const expoSpeechNarrator: Narrator = createExpoSpeechNarrator();

/** Solo para pruebas: olvida la voz elegida. */
export function resetVoiceCacheForTests() {
  voicePromise = null;
}
