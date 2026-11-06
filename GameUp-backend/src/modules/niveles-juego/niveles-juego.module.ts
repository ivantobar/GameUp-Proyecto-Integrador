import { Module } from '@nestjs/common';
import { EstudiantesModule } from '../estudiantes/estudiantes.module.js';
import { ModulosModule } from '../modulos/modulos.module.js';
import { NivelJuegoService } from './application/nivel-juego.service.js';
import { NIVEL_JUEGO_REPOSITORY } from './domain/nivel-juego.repository.js';
import { PrismaNivelJuegoRepository } from './infrastructure/prisma-nivel-juego.repository.js';
import { NivelJuegoController } from './presentation/nivel-juego.controller.js';

/**
 * Escalera de 5 niveles por juego (fase 9). Exporta el puerto para que los
 * intentos comprueben el nivel actual. La subida al aprobar la hace la
 * validación (subirSiCorresponde, en su transacción).
 */
@Module({
  imports: [EstudiantesModule, ModulosModule],
  controllers: [NivelJuegoController],
  providers: [
    NivelJuegoService,
    { provide: NIVEL_JUEGO_REPOSITORY, useClass: PrismaNivelJuegoRepository },
  ],
  exports: [NIVEL_JUEGO_REPOSITORY],
})
export class NivelesJuegoModule {}
