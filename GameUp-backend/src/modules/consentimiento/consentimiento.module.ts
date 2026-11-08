import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../config/env.validation.js';
import { EstudiantesModule } from '../estudiantes/estudiantes.module.js';
import { ConsentimientoService } from './application/consentimiento.service.js';
import {
  CONSULTA_CONSENTIMIENTO,
  type ConsultaConsentimiento,
} from './domain/consulta-consentimiento.js';
import { ConsultaConsentimientoAsiscoUpHttp } from './infrastructure/consentimiento-asiscoup-http.js';
import {
  ConsultaConsentimientoNoDisponible,
  ConsultaConsentimientoSimulada,
} from './infrastructure/consultas-consentimiento.js';
import { ConsentimientoController } from './presentation/consentimiento.controller.js';

/**
 * Elige de dónde se lee el consentimiento de voz:
 *   CONSENTIMIENTO_SIMULADO=true → simulado (solo desarrollo);
 *   sin ASISCO_API_URL → no disponible (falla cerrado, no se graba);
 *   con ASISCO_API_URL → ASISCO UP por HTTP.
 * Se exporta para probarla sin levantar Nest.
 */
export function crearConsultaConsentimiento(
  config: ConfigService<EnvironmentVariables, true>,
): ConsultaConsentimiento {
  if (config.get('CONSENTIMIENTO_SIMULADO', { infer: true })) {
    new Logger('Consentimiento').warn(
      'CONSENTIMIENTO_SIMULADO=true: todos los estudiantes figuran con consentimiento (solo desarrollo).',
    );
    return new ConsultaConsentimientoSimulada();
  }
  const url = config.get('ASISCO_API_URL', { infer: true });
  if (!url) return new ConsultaConsentimientoNoDisponible();
  return new ConsultaConsentimientoAsiscoUpHttp(
    url,
    config.get('ASISCO_API_TIMEOUT_MS', { infer: true }),
  );
}

/**
 * Consentimiento de grabación de voz: se lee de ASISCO UP (ASISCO_API_URL,
 * campo autorizaGrabacionVoz). Sin ASISCO_API_URL no se graba (falla
 * cerrado). Exporta ConsentimientoService para las grabaciones de Habla
 * conmigo (fase 6).
 */
@Module({
  imports: [EstudiantesModule],
  controllers: [ConsentimientoController],
  providers: [
    ConsentimientoService,
    {
      provide: CONSULTA_CONSENTIMIENTO,
      inject: [ConfigService],
      useFactory: crearConsultaConsentimiento,
    },
  ],
  exports: [ConsentimientoService],
})
export class ConsentimientoModule {}
