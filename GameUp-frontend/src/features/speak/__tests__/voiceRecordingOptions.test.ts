import { VOICE_RECORDING_OPTIONS } from '../useVoiceRecorder';

type NativeOptions = Record<string, unknown>;

/**
 * Lo que recibe el código nativo de un sistema: expo-audio convierte las
 * opciones con `createRecordingOptions` según `Platform.OS` antes de
 * llamar a `prepareToRecordAsync` nativo (que las usa tal cual, sin
 * combinarlas con las de la grabadora).
 */
function nativeOptionsFor(
  os: 'ios' | 'android',
  options: object,
): NativeOptions {
  let result: NativeOptions = {};
  jest.isolateModules(() => {
    jest.doMock('expo', () => ({ Platform: { OS: os } }));
    const { createRecordingOptions } = jest.requireActual<{
      createRecordingOptions: (o: object) => NativeOptions;
    }>('expo-audio/build/utils/options');
    result = createRecordingOptions(options);
  });
  return result;
}

const withName = {
  ...VOICE_RECORDING_OPTIONS,
  fileName: 'gameup-grabacion-prueba',
};

describe('opciones de grabación que llegan a cada sistema', () => {
  it('iPhone: m4a con AAC, calidad alta, medidor y nombre de GameUP', () => {
    expect(nativeOptionsFor('ios', withName)).toMatchObject({
      extension: '.m4a',
      outputFormat: 'aac ',
      audioQuality: 127,
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
      isMeteringEnabled: true,
      fileName: 'gameup-grabacion-prueba',
    });
  });

  it('Android: m4a (mpeg4) con AAC, medidor y nombre de GameUP', () => {
    expect(nativeOptionsFor('android', withName)).toMatchObject({
      extension: '.m4a',
      outputFormat: 'mpeg4',
      audioEncoder: 'aac',
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
      isMeteringEnabled: true,
      fileName: 'gameup-grabacion-prueba',
    });
  });

  it('por qué hace falta el preset: solo con el nombre no hay formato ni extensión', () => {
    // Lo que pasaba antes: iPhone grababa un archivo que no sonaba y Android
    // no tenía la extensión obligatoria.
    for (const os of ['ios', 'android'] as const) {
      const native = nativeOptionsFor(os, {
        fileName: 'gameup-grabacion-prueba',
      });
      expect(native.extension).toBeUndefined();
      expect(native.outputFormat).toBeUndefined();
    }
  });
});
