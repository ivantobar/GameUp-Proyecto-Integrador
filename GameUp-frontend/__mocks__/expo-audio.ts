/**
 * Simulación de expo-audio para Jest (el módulo nativo no existe en las
 * pruebas). Jest la usa automáticamente por estar en `__mocks__/` de la raíz.
 */
const player = {
  play: jest.fn(),
  pause: jest.fn(),
  seekTo: jest.fn(() => Promise.resolve()),
};

const recorder = {
  isRecording: false,
  uri: null as string | null,
  prepareToRecordAsync: jest.fn(() => Promise.resolve()),
  record: jest.fn(),
  stop: jest.fn(() => Promise.resolve()),
};

/**
 * Los presets REALES de expo-audio (son solo datos, sin código nativo): así
 * las pruebas ven las mismas opciones que la app en el teléfono.
 */
export const RecordingPresets = jest.requireActual(
  'expo-audio/build/RecordingConstants',
).RecordingPresets;
export const useAudioPlayer = jest.fn(() => player);
export const useAudioPlayerStatus = jest.fn(() => ({ playing: false }));
export const useAudioRecorder = jest.fn(() => recorder);
export const useAudioRecorderState = jest.fn(() => ({ metering: undefined }));
export const requestRecordingPermissionsAsync = jest.fn(() =>
  Promise.resolve({ granted: true }),
);
export const setAudioModeAsync = jest.fn(() => Promise.resolve());
