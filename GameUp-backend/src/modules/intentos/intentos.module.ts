import { Module } from '@nestjs/common';
import { AsignacionesModule } from '../asignaciones/asignaciones.module.js';
import { CatalogoModule } from '../catalogo/catalogo.module.js';
import { ConsentimientoModule } from '../consentimiento/consentimiento.module.js';
import { EstudiantesModule } from '../estudiantes/estudiantes.module.js';
import { ModulosModule } from '../modulos/modulos.module.js';
import { ContextoIntentoService } from './application/contexto-intento.service.js';
import { HablaConmigoService } from './application/habla-conmigo.service.js';
import { IntentoService } from './application/intento.service.js';
import { PracticaService } from './application/practica.service.js';
import {
  INTENTO_ESCRITURA_REPOSITORY,
  INTENTO_LECTURA_REPOSITORY,
} from './domain/intento.repository.js';
import { PrismaIntentoRepository } from './infrastructure/prisma-intento.repository.js';
import {
  IntentoController,
  PracticaController,
} from './presentation/intento.controller.js';

/**
 * Intentos de los juegos y grabaciones de Habla conmigo (con consentimiento).
 * Exporta IntentoService y el puerto de lectura para la validación (fase 7).
 */
@Module({
  imports: [
    AsignacionesModule,
    CatalogoModule,
    ConsentimientoModule,
    EstudiantesModule,
    ModulosModule,
  ],
  controllers: [IntentoController, PracticaController],
  providers: [
    ContextoIntentoService,
    IntentoService,
    HablaConmigoService,
    PracticaService,
    PrismaIntentoRepository,
    {
      provide: INTENTO_ESCRITURA_REPOSITORY,
      useExisting: PrismaIntentoRepository,
    },
    {
      provide: INTENTO_LECTURA_REPOSITORY,
      useExisting: PrismaIntentoRepository,
    },
  ],
  exports: [IntentoService, INTENTO_LECTURA_REPOSITORY],
})
export class IntentosModule {}
