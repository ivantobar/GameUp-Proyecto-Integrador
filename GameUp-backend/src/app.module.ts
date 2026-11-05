import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { FiltroErroresGlobal } from './common/errors/filtro-errores.filter.js';
import { RelojModule } from './common/reloj/reloj.module.js';
import { validateEnv } from './config/env.validation.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SupabaseModule } from './supabase/supabase.module.js';

@Module({
  imports: [
    // Lee .env y valida las variables al arrancar.
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // Base de datos (PostgreSQL) mediante Prisma.
    PrismaModule,
    // Servicios de Supabase (Storage para contenidos y grabaciones).
    SupabaseModule,
    // Hora actual inyectable (puerto Reloj).
    RelojModule,
    // Autenticación global: toda ruta exige token salvo las @Public().
    AuthModule,
    HealthModule,
  ],
  providers: [
    // Traduce errores de dominio y de la base a { statusCode, error, message }.
    { provide: APP_FILTER, useClass: FiltroErroresGlobal },
  ],
})
export class AppModule {}
