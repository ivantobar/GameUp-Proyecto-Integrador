// Configuración de Jest (antes estaba en package.json).
const path = require('path');

/**
 * jest-expo carga `expo-modules-core` desde la raíz del proyecto, pero ese
 * paquete no se instala directo (expo-doctor lo prohíbe): viene dentro de
 * `expo` y npm puede dejarlo en `node_modules/expo/node_modules/`. Aquí se
 * busca donde esté, a partir de `expo`. Solo afecta a las pruebas.
 */
const expoModulesCore = path.dirname(
  require.resolve('expo-modules-core/package.json', {
    paths: [path.dirname(require.resolve('expo/package.json'))],
  }),
);

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|native-base|react-native-svg|standard-navigation)',
  ],
  setupFilesAfterEnv: ['./jest.setup.ts'],
  /*
   * Velocidad sin saltar pruebas: cada proceso de Jest carga React Native,
   * Reanimated y el router de Expo (cientos de MB). Con los 7 procesos por
   * defecto en un equipo de 8 GB la memoria se agota y todo se vuelve lento
   * (272 s). Con la mitad de los núcleos y reciclando el proceso que pasa
   * de 700 MB, la suite completa tarda ~130 s.
   */
  maxWorkers: '50%',
  workerIdleMemoryLimit: '700MB',
  // Reanimated 4: resuelve sus módulos y los de Worklets para Node.
  resolver: 'react-native-reanimated/jest/resolver',
  moduleNameMapper: {
    '^expo-modules-core$': expoModulesCore,
    '^expo-modules-core/(.*)$': `${expoModulesCore}/$1`,
  },
};
