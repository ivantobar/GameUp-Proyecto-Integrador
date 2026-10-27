import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { API_PREFIX, configureApp } from './app.setup.js';
import type { EnvironmentVariables } from './config/env.validation.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const config = app.get(ConfigService<EnvironmentVariables, true>);
  const port = config.get('PORT', { infer: true });

  // 0.0.0.0 permite que el celular con Expo Go llegue al backend por la IP local.
  await app.listen(port, '0.0.0.0');
  Logger.log(
    `GameUP backend escuchando en http://localhost:${port}/${API_PREFIX}`,
    'Bootstrap',
  );
}
await bootstrap();
