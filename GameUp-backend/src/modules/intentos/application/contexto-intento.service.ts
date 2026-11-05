import { Inject, Injectable } from '@nestjs/common';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import {
  AccesoDenegadoError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../../../common/errors/dominio.errors.js';
import type { Asignacion } from '../../asignaciones/domain/asignacion.entity.js';
import {
  ASIGNACION_LECTURA_REPOSITORY,
  type AsignacionLecturaRepository,
} from '../../asignaciones/domain/asignacion.repository.js';
import type { Actividad } from '../../modulos/domain/modulo.entity.js';
import {
  ACTIVIDAD_REPOSITORY,
  type ActividadRepository,
} from '../../modulos/domain/modulo.repository.js';

export const MENSAJE_ACTIVIDAD_NO_EXISTE = 'La actividad no existe.';

export interface ContextoIntento {
  actividad: Actividad;
  asignacion: Asignacion;
}

/**
 * ¿Dónde cae el intento del estudiante? En la asignación SIN COMPLETAR del
 * módulo de la actividad. Si la actividad no existe, está inactiva o su
 * módulo no está asignado al estudiante → 404 (no se confirma que exista).
 */
@Injectable()
export class ContextoIntentoService {
  constructor(
    @Inject(ACTIVIDAD_REPOSITORY)
    private readonly actividades: ActividadRepository,
    @Inject(ASIGNACION_LECTURA_REPOSITORY)
    private readonly asignaciones: AsignacionLecturaRepository,
  ) {}

  async resolver(
    actual: UsuarioAutenticado,
    actividadId: bigint,
  ): Promise<ContextoIntento> {
    if (actual.rol !== 'ESTUDIANTE') {
      throw new AccesoDenegadoError(
        'Solo el estudiante registra sus intentos.',
      );
    }
    const actividad = await this.actividades.buscarPorId(actividadId);
    if (!actividad || !actividad.activa) {
      throw new RecursoNoEncontradoError(MENSAJE_ACTIVIDAD_NO_EXISTE);
    }

    const activas = await this.asignaciones.activasDelEstudiante(actual.id);
    const asignacion = activas.find((a) => a.modulo.id === actividad.moduloId);
    if (asignacion) return { actividad, asignacion };

    // La base tampoco acepta intentos en una asignación completada.
    const completadas = await this.asignaciones.listar(
      { tipo: 'propio', estudianteId: actual.id },
      {
        estudianteId: actual.id,
        moduloId: actividad.moduloId,
        estado: 'COMPLETADO',
      },
      { page: 1, limit: 1 },
    );
    if (completadas.total > 0) {
      throw new ReglaNegocioError(
        'Ya completaste este módulo: no se registran más intentos.',
      );
    }
    throw new RecursoNoEncontradoError(MENSAJE_ACTIVIDAD_NO_EXISTE);
  }
}
