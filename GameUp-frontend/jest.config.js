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
  moduleNameMapper: {
    '^expo-modules-core$': expoModulesCore,
    '^expo-modules-core/(.*)$': `${expoModulesCore}/$1`,
  },
};
