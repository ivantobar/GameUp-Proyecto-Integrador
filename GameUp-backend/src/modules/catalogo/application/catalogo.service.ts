import { Inject, Injectable } from '@nestjs/common';
import {
  CATALOGO_REPOSITORY,
  type CatalogoRepository,
  type Categoria,
  type Musica,
  type Nivel,
  type TipoJuego,
} from '../domain/catalogo.js';

/** Lectura del catálogo (cualquier persona con sesión). */
@Injectable()
export class CatalogoService {
  constructor(
    @Inject(CATALOGO_REPOSITORY) private readonly catalogo: CatalogoRepository,
  ) {}

  niveles(): Promise<Nivel[]> {
    return this.catalogo.niveles();
  }

  categorias(): Promise<Categoria[]> {
    return this.catalogo.categorias();
  }

  tiposJuego(): Promise<TipoJuego[]> {
    return this.catalogo.tiposJuego();
  }

  /** Solo la música activa: la que se puede elegir para un módulo. */
  musicaDisponible(): Promise<Musica[]> {
    return this.catalogo.musica(true);
  }
}
