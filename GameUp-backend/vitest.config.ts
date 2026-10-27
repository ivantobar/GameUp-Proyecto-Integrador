import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Resuelve los alias de tsconfig.json (ej.: los que agrega `nest g library`).
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
  },
});
