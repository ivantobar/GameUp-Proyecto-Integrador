import { Module } from '@nestjs/common';
import { CatalogoModule } from '../catalogo/catalogo.module.js';
import { AccesoModuloService } from './application/acceso-modulo.service.js';
import { ActividadService } from './application/actividad.service.js';
import { ContenidoService } from './application/contenido.service.js';
import { ModuloService } from './application/modulo.service.js';
import {
  ACTIVIDAD_REPOSITORY,
  CONTENIDO_REPOSITORY,
  MODULO_REPOSITORY,
} from './domain/modulo.repository.js';
import { PrismaActividadRepository } from './infrastructure/prisma-actividad.repository.js';
import {
  PrismaContenidoRepository,
  PrismaModuloRepository,
} from './infrastructure/prisma-modulo.repository.js';
import { ActividadController } from './presentation/actividad.controller.js';
import { ContenidoController } from './presentation/contenido.controller.js';
import { ModuloController } from './presentation/modulo.controller.js';

/**
 * Módulos educativos con sus contenidos (bucket `contenidos`) y actividades.
 * Exporta AccesoModuloService y los puertos para asignaciones e intentos.
 */
@Module({
  imports: [CatalogoModule],
  controllers: [ModuloController, ContenidoController, ActividadController],
  providers: [
    AccesoModuloService,
    ModuloService,
    ContenidoService,
    ActividadService,
    { provide: MODULO_REPOSITORY, useClass: PrismaModuloRepository },
    { provide: CONTENIDO_REPOSITORY, useClass: PrismaContenidoRepository },
    { provide: ACTIVIDAD_REPOSITORY, useClass: PrismaActividadRepository },
  ],
  exports: [AccesoModuloService, MODULO_REPOSITORY, ACTIVIDAD_REPOSITORY],
})
export class ModulosModule {}
