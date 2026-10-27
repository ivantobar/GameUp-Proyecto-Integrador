import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Resuelve los alias de tsconfig.json (ej.: los que agrega `nest g library`).
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // La validación de entorno exige DATABASE_URL. En las pruebas e2e no se
    // usa de verdad: PrismaService se reemplaza por un doble.
    env: { DATABASE_URL: 'postgresql://test:test@localhost:5432/test' },
  },
});
