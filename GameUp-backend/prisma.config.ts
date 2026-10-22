// Configuración de la CLI de Prisma (migrate, generate, studio).
// Igual que en proyecto-integrador-backend: lee DATABASE_URL desde .env.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const databaseUrl = process.env['DATABASE_URL'];

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  // `prisma generate` funciona sin DATABASE_URL (por ejemplo, en `npm install`
  // antes de crear el .env); migrate y studio sí la necesitan.
  datasource: databaseUrl ? { url: databaseUrl } : {},
});
