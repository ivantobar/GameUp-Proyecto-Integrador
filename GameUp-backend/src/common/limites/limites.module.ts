import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import type { EnvironmentVariables } from '../../config/env.validation.js';
import { crearOpcionesLimites, leerLimites } from './limites.js';

/**
 * Configura @nestjs/throttler con las variables THROTTLE_*. ThrottlerModule
 * es global: el guard (LimitePeticionesGuard, en AuthModule) recibe de aquí
 * sus opciones y su almacenamiento en memoria.
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) =>
        crearOpcionesLimites(leerLimites(config)),
    }),
  ],
})
export class LimitesModule {}
