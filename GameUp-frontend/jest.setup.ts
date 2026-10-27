import { act } from '@testing-library/react-native';

/**
 * Configuración común de Jest.
 * Los botones animan su color durante 150 ms. Con temporizadores simulados,
 * esas animaciones se completan dentro de `act` y las pruebas no dejan avisos.
 */
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(async () => {
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  loadAsyncFromUri: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
  isLoading: jest.fn(() => false),
  getLoadedFonts: jest.fn(() => []),
  unloadAsync: jest.fn(() => Promise.resolve()),
  unloadAllAsync: jest.fn(() => Promise.resolve()),
  useFonts: jest.fn(() => [true, null]),
}));

jest.setTimeout(30000);
