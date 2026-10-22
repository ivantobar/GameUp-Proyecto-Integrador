import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import type { EnvironmentVariables } from './config/env.validation.js';

export const API_PREFIX = 'api/v1';

/**
 * Configuración global de la API. Se comparte entre main.ts y las pruebas e2e
 * para que ambos se comporten igual.
 */
export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService<EnvironmentVariables, true>);

  // Todas las rutas quedan bajo /api/v1 (ej.: /api/v1/health).
  app.setGlobalPrefix(API_PREFIX);

  // Cabeceras HTTP de seguridad.
  app.use(helmet());

  // CORS es una restricción de los NAVEGADORES. La app móvil nativa (Expo Go)
  // no la usa, así que queda desactivado salvo que se definan orígenes web
  // en CORS_ORIGINS (por ejemplo, para probar con Expo en el navegador).
  const origins = (config.get('CORS_ORIGINS', { infer: true }) ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (origins.length > 0) {
    app.enableCors({ origin: origins });
  }

  // Valida los DTO: elimina campos no declarados y rechaza los desconocidos.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableShutdownHooks();
}
