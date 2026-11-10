import * as Speech from 'expo-speech';
import { createExpoSpeechNarrator, resetVoiceCacheForTests } from '../narrator';

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  getAvailableVoicesAsync: jest.fn(),
}));

const speak = Speech.speak as jest.Mock;
const voices = Speech.getAvailableVoicesAsync as jest.Mock;

/** Deja correr las promesas pendientes (la búsqueda de la voz). */
const flush = () => Promise.resolve().then(() => Promise.resolve());

function finishCurrentPhrase() {
  const options = speak.mock.calls[speak.mock.calls.length - 1][1];
  options.onDone();
}

beforeEach(() => {
  speak.mockReset();
  voices.mockReset();
  resetVoiceCacheForTests();
  voices.mockResolvedValue([
    { identifier: 'es-co-voz', language: 'es-CO', quality: 'Enhanced' },
  ]);
});

describe('narrador con la voz del teléfono', () => {
  it('lee frase por frase con la mejor voz y una pausa', async () => {
    const narrator = createExpoSpeechNarrator();
    narrator.speak('¡Muy bien! Toca la siguiente.');
    await flush();

    expect(speak).toHaveBeenCalledTimes(1);
    expect(speak.mock.calls[0][0]).toBe('¡Muy bien!');
    expect(speak.mock.calls[0][1]).toMatchObject({ voice: 'es-co-voz', pitch: 1.0, rate: 0.9 });

    finishCurrentPhrase();
    expect(speak).toHaveBeenCalledTimes(1); // todavía en la pausa
    jest.advanceTimersByTime(300);
    expect(speak).toHaveBeenCalledTimes(2);
    expect(speak.mock.calls[1][0]).toBe('Toca la siguiente.');
  });

  it('al detenerse no lee las frases que faltaban', async () => {
    const narrator = createExpoSpeechNarrator();
    narrator.speak('Uno. Dos.');
    await flush();
    finishCurrentPhrase();
    narrator.stop();
    jest.advanceTimersByTime(1000);
    expect(speak).toHaveBeenCalledTimes(1);
    expect(Speech.stop).toHaveBeenCalled();
  });

  it('sin voces en español usa la voz por defecto del idioma', async () => {
    voices.mockResolvedValue([]);
    const narrator = createExpoSpeechNarrator();
    narrator.speak('Hola.');
    await flush();
    expect(speak.mock.calls[0][1]).toMatchObject({ language: 'es-CO', voice: undefined });
  });
});
