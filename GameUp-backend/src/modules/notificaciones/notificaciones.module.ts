import { Module } from '@nestjs/common';
import { NotificacionService } from './application/notificacion.service.js';
import { NOTIFICACION_REPOSITORY } from './domain/notificacion.repository.js';
import { PrismaNotificacionRepository } from './infrastructure/prisma-notificacion.repository.js';
import { NotificacionController } from './presentation/notificacion.controller.js';

/**
 * Avisos de cada persona (los crea la base con triggers: AVANCE, NIVEL,
 * OBSERVACION y NUEVO_MODULO). Aquí solo se leen y se marcan como leídos.
 */
@Module({
  controllers: [NotificacionController],
  providers: [
    NotificacionService,
    {
      provide: NOTIFICACION_REPOSITORY,
      useClass: PrismaNotificacionRepository,
    },
  ],
})
export class NotificacionesModule {}
