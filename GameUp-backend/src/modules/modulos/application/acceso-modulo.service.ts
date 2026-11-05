import { Inject, Injectable } from '@nestjs/common';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import {
  AccesoDenegadoError,
  RecursoNoEncontradoError,
} from '../../../common/errors/dominio.errors.js';
import { alcanceDe } from '../../estudiantes/domain/alcance.js';
import type { Modulo } from '../domain/modulo.entity.js';
import {
  MODULO_REPOSITORY,
  type ModuloRepository,
  type VisibilidadModulos,
} from '../domain/modulo.repository.js';

export const MENSAJE_MODULO_NO_EXISTE = 'El módulo no existe.';

/**
 * Quién ve y quién modifica un módulo (y sus contenidos y actividades):
 *  - DIRECTORA: ve y modifica todos.
 *  - TALLERISTA: ve los publicados y los suyos; modifica solo los suyos.
 *  - ESTUDIANTE y ACUDIENTE: ven un módulo solo si está asignado a él (o a
 *    uno de sus estudiantes). Nunca lo modifican.
 * Lo que no puede ver responde 404, para no revelar borradores ajenos.
 */
@Injectable()
export class AccesoModuloService {
  constructor(
    @Inject(MODULO_REPOSITORY) private readonly modulos: ModuloRepository,
  ) {}

  visibilidadDe(actual: UsuarioAutenticado): VisibilidadModulos {
    return actual.rol === 'TALLERISTA'
      ? { tipo: 'tallerista', talleristaId: actual.id }
      : { tipo: 'todos' };
  }

  async ver(actual: UsuarioAutenticado, moduloId: bigint): Promise<Modulo> {
    const modulo = await this.modulos.buscarPorId(moduloId);
    if (!modulo || !(await this.puedeVer(actual, modulo))) {
      throw new RecursoNoEncontradoError(MENSAJE_MODULO_NO_EXISTE);
    }
    return modulo;
  }

  async editar(actual: UsuarioAutenticado, moduloId: bigint): Promise<Modulo> {
    const modulo = await this.ver(actual, moduloId);
    if (actual.rol === 'DIRECTORA') return modulo;
    if (actual.rol === 'TALLERISTA' && modulo.esAutor(actual.id)) return modulo;
    throw new AccesoDenegadoError(
      'Solo quien creó el módulo o la directora puede modificarlo.',
    );
  }

  /** ¿Es estudiante o acudiente? (ven solo lo asignado y solo actividades activas) */
  esFamilia(actual: UsuarioAutenticado): boolean {
    return actual.rol === 'ESTUDIANTE' || actual.rol === 'ACUDIENTE';
  }

  private async puedeVer(
    actual: UsuarioAutenticado,
    modulo: Modulo,
  ): Promise<boolean> {
    switch (actual.rol) {
      case 'DIRECTORA':
        return true;
      case 'TALLERISTA':
        return modulo.publicado || modulo.esAutor(actual.id);
      case 'ESTUDIANTE':
      case 'ACUDIENTE':
        return this.modulos.asignadoEnAlcance(alcanceDe(actual), modulo.id);
    }
  }
}
