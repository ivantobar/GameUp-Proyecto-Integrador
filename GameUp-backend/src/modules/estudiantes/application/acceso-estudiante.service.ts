import { Inject, Injectable } from '@nestjs/common';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import { RecursoNoEncontradoError } from '../../../common/errors/dominio.errors.js';
import { alcanceDe } from '../domain/alcance.js';
import type { Estudiante } from '../domain/estudiante.entity.js';
import {
  ESTUDIANTE_LECTURA_REPOSITORY,
  type EstudianteLecturaRepository,
} from '../domain/estudiante.repository.js';

/** Mismo texto exista o no: no se confirma que un estudiante ajeno existe. */
export const MENSAJE_ESTUDIANTE_NO_EXISTE = 'El estudiante no existe.';

/**
 * Segundo nivel de autorización: ¿esta persona puede trabajar con este
 * estudiante? Lo usan todos los módulos que tocan datos de un estudiante.
 * Si no le corresponde, responde 404 (nunca 403).
 */
@Injectable()
export class AccesoEstudianteService {
  constructor(
    @Inject(ESTUDIANTE_LECTURA_REPOSITORY)
    private readonly estudiantes: EstudianteLecturaRepository,
  ) {}

  async verificar(
    actual: UsuarioAutenticado,
    estudianteId: bigint,
  ): Promise<void> {
    if (
      !(await this.estudiantes.estaEnAlcance(alcanceDe(actual), estudianteId))
    ) {
      throw new RecursoNoEncontradoError(MENSAJE_ESTUDIANTE_NO_EXISTE);
    }
  }

  /** Verifica el acceso y devuelve el estudiante. */
  async obtenerVisible(
    actual: UsuarioAutenticado,
    estudianteId: bigint,
  ): Promise<Estudiante> {
    await this.verificar(actual, estudianteId);
    return this.existente(estudianteId);
  }

  /** Para la directora (sin filtro de relación): 404 si no existe. */
  async existente(estudianteId: bigint): Promise<Estudiante> {
    const estudiante = await this.estudiantes.buscarPorId(estudianteId);
    if (!estudiante)
      throw new RecursoNoEncontradoError(MENSAJE_ESTUDIANTE_NO_EXISTE);
    return estudiante;
  }
}
