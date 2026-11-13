import { Module } from '@nestjs/common';
import { ConsentimientoModule } from '../consentimiento/consentimiento.module.js';
import { EstudiantesModule } from '../estudiantes/estudiantes.module.js';
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
 * entrega del audio con URL firmada (si el consentimiento sigue vigente) y
 * su borrado (al validar, a los 30 días y a pedido de la directora), con
 * limpieza periódica.
 */
@Module({
  // Consentimiento: el audio solo se entrega si sigue vigente en ASISCO UP.
  imports: [IntentosModule, EstudiantesModule, ConsentimientoModule],
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
