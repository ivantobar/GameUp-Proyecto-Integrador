import type { ComponentType } from 'react';

/**
 * «Modo desarrollo». La pantalla usa los datos simulados (con la contraseña
 * de prueba), así que solo se carga en desarrollo: en una versión publicada,
 * `__DEV__` es `false`, el `require` desaparece del paquete y los simulados
 * no entran en la APK. Además, `dev/_layout.tsx` lleva a «Iniciar sesión».
 */
const DevHome: ComponentType = __DEV__
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@/features/dev/DevHome').DevHome
  : () => null;

export default DevHome;
