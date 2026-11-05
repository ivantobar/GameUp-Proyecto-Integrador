import { Module } from '@nestjs/common';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { AccesoEstudianteService } from './application/acceso-estudiante.service.js';
import { EstudianteService } from './application/estudiante.service.js';
import { VinculosService } from './application/vinculos.service.js';
import {
  ACUDIENTE_ESTUDIANTE_REPOSITORY,
  ESTUDIANTE_LECTURA_REPOSITORY,
  NIVEL_ESTUDIANTE_REPOSITORY,
  TALLERISTA_ESTUDIANTE_REPOSITORY,
} from './domain/estudiante.repository.js';
import {
  PrismaAcudienteEstudianteRepository,
  PrismaEstudianteRepository,
  PrismaTalleristaEstudianteRepository,
} from './infrastructure/prisma-estudiante.repository.js';
import { EstudianteController } from './presentation/estudiante.controller.js';
import { VinculosController } from './presentation/vinculos.controller.js';

/**
 * Estudiantes y sus vínculos. Exporta AccesoEstudianteService (regla de
 * relación) y el puerto de lectura para los módulos de las fases siguientes.
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
  ],
  exports: [AccesoEstudianteService, ESTUDIANTE_LECTURA_REPOSITORY],
})
export class EstudiantesModule {}
