import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SupabaseModule } from './supabase/supabase.module.js';

@Module({
  imports: [
    // Lee .env y valida las variables al arrancar.
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // Base de datos (PostgreSQL) mediante Prisma.
    PrismaModule,
    // Servicios de Supabase (Auth y Storage para grabaciones), cuando se usen.
    SupabaseModule,
    HealthModule,
    // Aquí se irán agregando: AuthModule, UsersModule, ActivitiesModule, ...
  ],
})
export class AppModule {}
