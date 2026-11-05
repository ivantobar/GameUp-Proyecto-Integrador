import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Resuelve los alias de tsconfig.json (ej.: los que agrega `nest g library`).
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Un proceso por archivo: cada uno tiene su propia carpeta de subidas.
    pool: 'forks',
    // La validación de entorno exige DATABASE_URL. En las pruebas e2e no se
    // usa de verdad: PrismaService se reemplaza por un doble.
    // CONSENTIMIENTO_SIMULADO se fija en false para que el .env de quien
    // corre las pruebas no cambie el resultado (las pruebas lo activan a mano).
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      CONSENTIMIENTO_SIMULADO: 'false',
      // Sin limpieza periódica en las pruebas (se prueba llamándola a mano).
      LIMPIEZA_GRABACIONES_MIN: '0',
    },
  },
});
