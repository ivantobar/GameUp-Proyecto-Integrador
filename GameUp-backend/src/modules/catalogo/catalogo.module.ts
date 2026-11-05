import { Module } from '@nestjs/common';
import { CatalogoService } from './application/catalogo.service.js';
import { RegistroJuegosService } from './application/registro-juegos.service.js';
import { CATALOGO_REPOSITORY } from './domain/catalogo.js';
import { ESTRATEGIAS_JUEGO } from './domain/juegos/estrategia-juego.js';
import { estrategiasDelMvp } from './domain/juegos/estrategias.js';
import { PrismaCatalogoRepository } from './infrastructure/prisma-catalogo.repository.js';
import { CatalogoController } from './presentation/catalogo.controller.js';

/**
 * Catálogo de solo lectura (niveles, categorías, tipos de juego, música) y el
 * registro de estrategias por tipo de juego. Exporta ambos para módulos,
 * actividades e intentos.
 */
@Module({
  controllers: [CatalogoController],
  providers: [
    { provide: CATALOGO_REPOSITORY, useClass: PrismaCatalogoRepository },
    { provide: ESTRATEGIAS_JUEGO, useFactory: estrategiasDelMvp },
    CatalogoService,
    RegistroJuegosService,
  ],
  exports: [CATALOGO_REPOSITORY, RegistroJuegosService],
})
export class CatalogoModule {}
