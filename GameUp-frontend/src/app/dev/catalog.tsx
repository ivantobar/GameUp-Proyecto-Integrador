import type { ComponentType } from 'react';

/**
 * Catálogo de componentes, solo en desarrollo (ver `dev/index.tsx`): en una
 * versión publicada el `require` desaparece y la pantalla no entra en la APK.
 */
const CatalogScreen: ComponentType = __DEV__
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@/features/dev/CatalogScreen').CatalogScreen
  : () => null;

export default CatalogScreen;
