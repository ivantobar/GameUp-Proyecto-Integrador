import { Module } from '@nestjs/common';
import { EstudiantesModule } from '../estudiantes/estudiantes.module.js';
import { ModulosModule } from '../modulos/modulos.module.js';
import { AsignacionService } from './application/asignacion.service.js';
import { AvanceAsignacionService } from './application/avance-asignacion.service.js';
import {
  ASIGNACION_ESCRITURA_REPOSITORY,
  ASIGNACION_LECTURA_REPOSITORY,
} from './domain/asignacion.repository.js';
import { PrismaAsignacionRepository } from './infrastructure/prisma-asignacion.repository.js';
import {
  AsignacionController,
  PendientesController,
} from './presentation/asignacion.controller.js';

/**
 * Asignaciones de módulos a estudiantes y su avance. Exporta AsignacionService
 * (acceso a una asignación) y el puerto de lectura para intentos (fase 6).
 */
@Module({
  imports: [EstudiantesModule, ModulosModule],
  controllers: [AsignacionController, PendientesController],
  providers: [
    AsignacionService,
    AvanceAsignacionService,
    PrismaAsignacionRepository,
    {
      provide: ASIGNACION_LECTURA_REPOSITORY,
      useExisting: PrismaAsignacionRepository,
    },
    {
      provide: ASIGNACION_ESCRITURA_REPOSITORY,
      useExisting: PrismaAsignacionRepository,
    },
  ],
  exports: [AsignacionService, ASIGNACION_LECTURA_REPOSITORY],
})
export class AsignacionesModule {}
