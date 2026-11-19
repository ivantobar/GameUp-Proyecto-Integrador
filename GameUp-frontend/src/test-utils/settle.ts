import { act } from '@testing-library/react-native';

/**
 * Corre todos los temporizadores simulados hasta que la pantalla se quede
 * quieta. Una sola pasada de `runAllTimersAsync` no basta cuando, al aplicar
 * los cambios de `act`, la pantalla programa trabajo nuevo (por ejemplo, la
 * recarga de una lista o los cuadros de una animación de Reanimated): por
 * eso se repite hasta que no queda ningún temporizador pendiente.
 */
export async function settle(maxRounds = 10): Promise<void> {
  for (let round = 0; round < maxRounds; round += 1) {
    await act(async () => {
      await jest.runAllTimersAsync();
    });
    if (jest.getTimerCount() === 0) return;
  }
}
