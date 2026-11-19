import type { ComponentType } from 'react';

/**
 * Prueba de conexión con el backend, solo en desarrollo (ver
 * `dev/index.tsx`): en una versión publicada el `require` desaparece y la
 * pantalla no entra en la APK.
 */
const ConnectionScreen: ComponentType = __DEV__
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@/features/dev/ConnectionScreen').ConnectionScreen
  : () => null;

export default ConnectionScreen;
