import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../config/env.validation.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { AccesoEstudianteService } from './application/acceso-estudiante.service.js';
import { EstudianteService } from './application/estudiante.service.js';
import { SincronizacionVinculosService } from './application/sincronizacion-vinculos.service.js';
import { VinculosService } from './application/vinculos.service.js';
import {
  ACUDIENTE_ESTUDIANTE_REPOSITORY,
  ESTUDIANTE_LECTURA_REPOSITORY,
  NIVEL_ESTUDIANTE_REPOSITORY,
  TALLERISTA_ESTUDIANTE_REPOSITORY,
} from './domain/estudiante.repository.js';
import {
  COPIA_VINCULOS_REPOSITORY,
  SINCRONIZADOR_VINCULOS,
  VINCULOS_EN_ASISCO,
  type CopiaVinculosRepository,
  type SincronizadorVinculos,
} from './domain/vinculos-externos.js';
import { PrismaCopiaVinculosRepository } from './infrastructure/prisma-copia-vinculos.repository.js';
import {
  PrismaAcudienteEstudianteRepository,
  PrismaEstudianteRepository,
  PrismaTalleristaEstudianteRepository,
} from './infrastructure/prisma-estudiante.repository.js';
import { ConsultaVinculosAsiscoUpHttp } from './infrastructure/vinculos-asiscoup-http.js';
import { EstudianteController } from './presentation/estudiante.controller.js';
import { VinculosController } from './presentation/vinculos.controller.js';

/** true con ASISCO_API_URL: los vínculos de acudientes son de ASISCO UP. */
export function vinculosEnAsisco(
  config: ConfigService<EnvironmentVariables, true>,
): boolean {
  return Boolean(config.get('ASISCO_API_URL', { infer: true }));
}

/**
 * Sincronizador de vínculos con ASISCO UP, o null si falta ASISCO_API_URL
 * (entonces el login no consulta nada). Se exporta para probarla sin Nest.
 */
export function crearSincronizadorVinculos(
  config: ConfigService<EnvironmentVariables, true>,
  copia: CopiaVinculosRepository,
): SincronizadorVinculos | null {
  const url = config.get('ASISCO_API_URL', { infer: true });
  if (!url) return null;
  return new SincronizacionVinculosService(
    new ConsultaVinculosAsiscoUpHttp(
      url,
      config.get('ASISCO_API_TIMEOUT_MS', { infer: true }),
    ),
    copia,
  );
}

/**
 * Estudiantes y sus vínculos. Exporta AccesoEstudianteService (regla de
 * relación), el puerto de lectura para los módulos de las fases siguientes y
 * el sincronizador de vínculos con ASISCO UP (lo usa el login del acudiente;
 * es null si falta ASISCO_API_URL).
 */
@Module({
  imports: [UsuariosModule],
  controllers: [EstudianteController, VinculosController],
  providers: [
    AccesoEstudianteService,
    EstudianteService,
    VinculosService,
    PrismaEstudianteRepository,
    {
      provide: ESTUDIANTE_LECTURA_REPOSITORY,
      useExisting: PrismaEstudianteRepository,
    },
    {
      provide: NIVEL_ESTUDIANTE_REPOSITORY,
      useExisting: PrismaEstudianteRepository,
    },
    {
      provide: TALLERISTA_ESTUDIANTE_REPOSITORY,
      useClass: PrismaTalleristaEstudianteRepository,
    },
    {
      provide: ACUDIENTE_ESTUDIANTE_REPOSITORY,
      useClass: PrismaAcudienteEstudianteRepository,
    },
    {
      provide: COPIA_VINCULOS_REPOSITORY,
      useClass: PrismaCopiaVinculosRepository,
    },
    {
      provide: VINCULOS_EN_ASISCO,
      inject: [ConfigService],
      useFactory: vinculosEnAsisco,
    },
    {
      provide: SINCRONIZADOR_VINCULOS,
      inject: [ConfigService, COPIA_VINCULOS_REPOSITORY],
      useFactory: crearSincronizadorVinculos,
    },
  ],
  exports: [
    AccesoEstudianteService,
    ESTUDIANTE_LECTURA_REPOSITORY,
    SINCRONIZADOR_VINCULOS,
  ],
})
export class EstudiantesModule {}
