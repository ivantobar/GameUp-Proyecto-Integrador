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
