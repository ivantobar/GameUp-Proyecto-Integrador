import { Module } from '@nestjs/common';
import { IntentosModule } from '../intentos/intentos.module.js';
import { GrabacionService } from './application/grabacion.service.js';
import { LimpiezaGrabaciones } from './application/limpieza-grabaciones.js';
import { ValidacionService } from './application/validacion.service.js';
import { REGISTRO_ESCUCHA } from './domain/registro-escucha.js';
import {
  GRABACION_REPOSITORY,
  REVISION_LECTURA_REPOSITORY,
  VALIDACION_ESCRITURA_REPOSITORY,
} from './domain/validacion.repository.js';
import { PrismaValidacionRepository } from './infrastructure/prisma-validacion.repository.js';
import { RegistroEscuchaEnMemoria } from './infrastructure/registro-escucha-en-memoria.js';
import { ValidacionController } from './presentation/validacion.controller.js';

/**
 * Validación de intentos (la de voz exige haber pedido el audio antes),
 * entrega del audio con URL firmada y su borrado (al validar y a los 30
 * días), con limpieza periódica.
 */
@Module({
  imports: [IntentosModule],
  controllers: [ValidacionController],
  providers: [
    ValidacionService,
    GrabacionService,
    LimpiezaGrabaciones,
    PrismaValidacionRepository,
    {
      provide: REVISION_LECTURA_REPOSITORY,
      useExisting: PrismaValidacionRepository,
    },
    {
      provide: VALIDACION_ESCRITURA_REPOSITORY,
      useExisting: PrismaValidacionRepository,
    },
    { provide: GRABACION_REPOSITORY, useExisting: PrismaValidacionRepository },
    { provide: REGISTRO_ESCUCHA, useClass: RegistroEscuchaEnMemoria },
  ],
})
export class ValidacionesModule {}
