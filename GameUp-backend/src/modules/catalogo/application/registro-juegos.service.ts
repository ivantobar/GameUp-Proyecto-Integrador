import { Inject, Injectable } from '@nestjs/common';
import { ReglaNegocioError } from '../../../common/errors/dominio.errors.js';
import {
  ESTRATEGIAS_JUEGO,
  esCodigoJuego,
  type EstrategiaJuego,
} from '../domain/juegos/estrategia-juego.js';

/** Encuentra la estrategia de cada tipo de juego (lo usan actividades e intentos). */
@Injectable()
export class RegistroJuegosService {
  private readonly porCodigo: Map<string, EstrategiaJuego>;

  constructor(@Inject(ESTRATEGIAS_JUEGO) estrategias: EstrategiaJuego[]) {
    this.porCodigo = new Map(estrategias.map((e) => [e.codigo, e]));
  }

  estrategia(codigo: string): EstrategiaJuego {
    const estrategia = esCodigoJuego(codigo)
      ? this.porCodigo.get(codigo)
      : undefined;
    if (!estrategia) {
      throw new ReglaNegocioError(
        `El tipo de juego ${codigo} no está disponible.`,
      );
    }
    return estrategia;
  }
}
