import { act } from '@testing-library/react-native';

/*
 * Reanimated NO se configura aquí a propósito: importarlo en este archivo
 * lo carga en TODAS las pruebas (también en las de datos, que no dibujan
 * nada) y cuesta ~1,5 s por archivo. Las pruebas que dibujan componentes
 * animados lo cargan solas; la que lee estilos animados
 * (`getAnimatedStyle`) llama a `setUpTests()` en su propio archivo.
 */

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
