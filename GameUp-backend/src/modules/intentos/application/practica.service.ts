import { Inject, Injectable } from '@nestjs/common';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import { AccesoDenegadoError } from '../../../common/errors/dominio.errors.js';
import {
  VOCALES,
  type Vocal,
} from '../../catalogo/domain/juegos/estrategias.js';
import { MAXIMO_ESTRELLAS } from '../domain/intento.entity.js';
import {
  INTENTO_LECTURA_REPOSITORY,
  type IntentoLecturaRepository,
} from '../domain/intento.repository.js';

export interface PracticaVocal {
  vocal: Vocal;
  /** 0-3: un ciclo Mira → Dilo → Listo suma una (no es una nota). */
  estrellas: number;
}

/**
 * Práctica de vocales del estudiante con sesión (opción A de la fase 0): las
 * estrellas y el «Sigue donde ibas» salen de sus intentos de Habla conmigo,
 * sin tablas nuevas. No es el progreso oficial (ese solo cuenta lo validado).
 */
@Injectable()
export class PracticaService {
  constructor(
    @Inject(INTENTO_LECTURA_REPOSITORY)
    private readonly intentos: IntentoLecturaRepository,
  ) {}

  async vocales(actual: UsuarioAutenticado): Promise<PracticaVocal[]> {
    this.exigirEstudiante(actual);
    const porVocal = await this.intentos.intentosPorVocal(actual.id);
    return VOCALES.map((vocal) => ({
      vocal,
      estrellas: Math.min(MAXIMO_ESTRELLAS, porVocal.get(vocal) ?? 0),
    }));
  }

  async puntoRetorno(actual: UsuarioAutenticado): Promise<Vocal | null> {
    this.exigirEstudiante(actual);
    const vocal = await this.intentos.ultimaVocal(actual.id);
    return (VOCALES as readonly string[]).includes(vocal ?? '')
      ? (vocal as Vocal)
      : null;
  }

  private exigirEstudiante(actual: UsuarioAutenticado): void {
    if (actual.rol !== 'ESTUDIANTE') {
      throw new AccesoDenegadoError('Solo el estudiante consulta su práctica.');
    }
  }
}
