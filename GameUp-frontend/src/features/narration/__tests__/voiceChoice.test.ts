import { pickBestVoice, splitPhrases } from '../voiceChoice';

describe('pickBestVoice', () => {
  it('prefiere una voz mejorada en español latino', () => {
    expect(
      pickBestVoice([
        { identifier: 'com.apple.voice.compact.es-ES.Monica', language: 'es-ES', quality: 'Default' },
        { identifier: 'com.apple.voice.compact.es-MX.Paulina', language: 'es-MX', quality: 'Default' },
        { identifier: 'com.apple.voice.enhanced.es-MX.Paulina', language: 'es-MX', quality: 'Enhanced' },
        { identifier: 'com.apple.voice.compact.en-US.Samantha', language: 'en-US', quality: 'Default' },
      ]),
    ).toBe('com.apple.voice.enhanced.es-MX.Paulina');
  });

  it('prefiere Colombia cuando la calidad es igual', () => {
    expect(
      pickBestVoice([
        { identifier: 'es-mx-x-a', language: 'es-MX' },
        { identifier: 'es-co-x-b', language: 'es-CO' },
      ]),
    ).toBe('es-co-x-b');
  });

  it('evita las voces de novedad y las que usan internet', () => {
    expect(
      pickBestVoice([
        { identifier: 'com.apple.eloquence.es-MX.Grandma', language: 'es-MX', quality: 'Enhanced' },
        { identifier: 'es-us-x-esd-network', language: 'es-US' },
        { identifier: 'es-us-x-esc-local', language: 'es-US' },
      ]),
    ).toBe('es-us-x-esc-local');
  });

  it('no devuelve nada si no hay voces en español', () => {
    expect(pickBestVoice([{ identifier: 'en', language: 'en-US' }])).toBeUndefined();
    expect(pickBestVoice([])).toBeUndefined();
  });
});

describe('splitPhrases', () => {
  it('parte en frases sin perder los signos', () => {
    expect(splitPhrases('¡Hola, Sara! Tienes 2 juegos. ¿Qué va primero?')).toEqual([
      '¡Hola, Sara!',
      'Tienes 2 juegos.',
      '¿Qué va primero?',
    ]);
  });

  it('pasa una vocal sola a minúscula', () => {
    expect(splitPhrases('A')).toEqual(['a']);
  });

  it('ignora el texto vacío', () => {
    expect(splitPhrases('   ')).toEqual([]);
  });
});
