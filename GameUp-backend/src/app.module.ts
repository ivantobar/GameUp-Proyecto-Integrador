import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AlmacenamientoModule } from './common/almacenamiento/almacenamiento.module.js';
import { FiltroErroresGlobal } from './common/errors/filtro-errores.filter.js';
import { RelojModule } from './common/reloj/reloj.module.js';
import { validateEnv } from './config/env.validation.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CatalogoModule } from './modules/catalogo/catalogo.module.js';
import { ConsentimientoModule } from './modules/consentimiento/consentimiento.module.js';
import { EstudiantesModule } from './modules/estudiantes/estudiantes.module.js';
import { ModulosModule } from './modules/modulos/modulos.module.js';
import { UsuariosModule } from './modules/usuarios/usuarios.module.js';
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
    // Archivos en Storage (puerto AlmacenArchivos).
    AlmacenamientoModule,
    // Autenticación global: toda ruta exige token salvo las @Public().
    AuthModule,
    HealthModule,
    // Fase 2: cuentas de GameUP (directora).
    UsuariosModule,
    // Fase 3: estudiantes, vínculos, nivel y consentimiento de voz.
    EstudiantesModule,
    ConsentimientoModule,
    // Fase 4: catálogo, módulos, contenidos y actividades.
    CatalogoModule,
    ModulosModule,
  ],
  providers: [
    // Traduce errores de dominio y de la base a { statusCode, error, message }.
    { provide: APP_FILTER, useClass: FiltroErroresGlobal },
  ],
})
export class AppModule {}
