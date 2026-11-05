import { Module } from '@nestjs/common';
import { EstudiantesModule } from '../estudiantes/estudiantes.module.js';
import { PracticaCasaService } from './application/practica-casa.service.js';
import { PRACTICA_CASA_REPOSITORY } from './domain/practica-casa.repository.js';
import { PrismaPracticaCasaRepository } from './infrastructure/prisma-practica-casa.repository.js';
import { PracticaCasaController } from './presentation/practica-casa.controller.js';

/**
 * «Lo practicamos hoy» del acudiente (tabla practica_casa, migración
 * 20261105120000_practica_casa: debe estar aplicada para que funcione).
 */
@Module({
  imports: [EstudiantesModule],
  controllers: [PracticaCasaController],
  providers: [
    PracticaCasaService,
    {
      provide: PRACTICA_CASA_REPOSITORY,
      useClass: PrismaPracticaCasaRepository,
    },
  ],
})
export class PracticaCasaModule {}
