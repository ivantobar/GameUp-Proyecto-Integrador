import { Module } from '@nestjs/common';
import { EstudiantesModule } from '../estudiantes/estudiantes.module.js';
import { ObservacionService } from './application/observacion.service.js';
import {
  OBSERVACION_ESCRITURA_REPOSITORY,
  OBSERVACION_LECTURA_REPOSITORY,
} from './domain/observacion.repository.js';
import { PrismaObservacionRepository } from './infrastructure/prisma-observacion.repository.js';
import { ObservacionController } from './presentation/observacion.controller.js';

/**
 * Observaciones de seguimiento: las escriben la directora y la tallerista a
 * cargo; el acudiente ve las que marcan como visibles para él.
 */
@Module({
  imports: [EstudiantesModule],
  controllers: [ObservacionController],
  providers: [
    ObservacionService,
    PrismaObservacionRepository,
    {
      provide: OBSERVACION_LECTURA_REPOSITORY,
      useExisting: PrismaObservacionRepository,
    },
    {
      provide: OBSERVACION_ESCRITURA_REPOSITORY,
      useExisting: PrismaObservacionRepository,
    },
  ],
})
export class ObservacionesModule {}
