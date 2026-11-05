import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../config/env.validation.js';
import { EstudiantesModule } from '../estudiantes/estudiantes.module.js';
import { ConsentimientoService } from './application/consentimiento.service.js';
import {
  CONSULTA_CONSENTIMIENTO,
  type ConsultaConsentimiento,
} from './domain/consulta-consentimiento.js';
import {
  ConsultaConsentimientoNoDisponible,
  ConsultaConsentimientoSimulada,
} from './infrastructure/consultas-consentimiento.js';
import { ConsentimientoController } from './presentation/consentimiento.controller.js';

/**
 * Consentimiento de grabación de voz. Exporta ConsentimientoService para las
 * grabaciones de Habla conmigo (fase 6).
 */
@Module({
  imports: [EstudiantesModule],
  controllers: [ConsentimientoController],
  providers: [
    ConsentimientoService,
    {
      provide: CONSULTA_CONSENTIMIENTO,
      inject: [ConfigService],
      useFactory: (
        config: ConfigService<EnvironmentVariables, true>,
      ): ConsultaConsentimiento => {
        if (config.get('CONSENTIMIENTO_SIMULADO', { infer: true })) {
          new Logger('Consentimiento').warn(
            'CONSENTIMIENTO_SIMULADO=true: todos los estudiantes figuran con consentimiento (solo desarrollo).',
          );
          return new ConsultaConsentimientoSimulada();
        }
        return new ConsultaConsentimientoNoDisponible();
      },
    },
  ],
  exports: [ConsentimientoService],
})
export class ConsentimientoModule {}
