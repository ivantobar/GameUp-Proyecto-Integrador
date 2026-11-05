import { Inject, Injectable } from '@nestjs/common';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import {
  AccesoDenegadoError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../../../common/errors/dominio.errors.js';
import type {
  Pagina,
  Paginacion,
} from '../../../common/paginacion/paginacion.js';
import { AccesoEstudianteService } from '../../estudiantes/application/acceso-estudiante.service.js';
import {
  normalizarTextoObservacion,
  type Observacion,
} from '../domain/observacion.entity.js';
import {
  OBSERVACION_ESCRITURA_REPOSITORY,
  OBSERVACION_LECTURA_REPOSITORY,
  type CambiosObservacion,
  type ObservacionEscrituraRepository,
  type ObservacionLecturaRepository,
} from '../domain/observacion.repository.js';

export const MENSAJE_OBSERVACION_NO_EXISTE = 'La observación no existe.';

/**
 * Observaciones de seguimiento. Las escriben la directora y la tallerista a
 * cargo; el acudiente solo ve las marcadas como visibles para él. Estudiante
 * ajeno → 404 (no se confirma que existe).
 */
@Injectable()
export class ObservacionService {
  constructor(
    @Inject(OBSERVACION_LECTURA_REPOSITORY)
    private readonly lectura: ObservacionLecturaRepository,
    @Inject(OBSERVACION_ESCRITURA_REPOSITORY)
    private readonly escritura: ObservacionEscrituraRepository,
    private readonly acceso: AccesoEstudianteService,
  ) {}

  async listar(
    actual: UsuarioAutenticado,
    estudianteId: bigint,
    paginacion: Paginacion,
  ): Promise<Pagina<Observacion>> {
    await this.acceso.verificar(actual, estudianteId);
    return this.lectura.listar(
      estudianteId,
      actual.rol === 'ACUDIENTE',
      paginacion,
    );
  }

  /** Directora o tallerista a cargo. Si es visible, la base avisa a los acudientes. */
  async crear(
    actual: UsuarioAutenticado,
    estudianteId: bigint,
    texto: string,
    visibleAcudiente: boolean,
  ): Promise<Observacion> {
    this.exigirPersonal(actual);
    await this.acceso.verificar(actual, estudianteId);
    return this.escritura.crear({
      estudianteId,
      autorId: actual.id,
      texto: normalizarTextoObservacion(texto),
      visibleAcudiente,
    });
  }

  /**
   * Solo quien la escribió o la directora, y la tallerista solo mientras
   * tenga al estudiante a cargo. Al hacerla visible, la base avisa a los
   * acudientes (una sola vez: si ya era visible, no se repite el aviso).
   */
  async editar(
    actual: UsuarioAutenticado,
    id: bigint,
    cambios: CambiosObservacion,
  ): Promise<Observacion> {
    this.exigirPersonal(actual);
    if (cambios.texto === null && cambios.visibleAcudiente === null) {
      throw new ReglaNegocioError(
        'Indica qué cambiar: el texto o si la ve el acudiente.',
      );
    }
    const observacion = await this.lectura.buscarPorId(id);
    if (!observacion)
      throw new RecursoNoEncontradoError(MENSAJE_OBSERVACION_NO_EXISTE);
    try {
      await this.acceso.verificar(actual, observacion.estudianteId);
    } catch (error) {
      if (error instanceof RecursoNoEncontradoError) {
        throw new RecursoNoEncontradoError(MENSAJE_OBSERVACION_NO_EXISTE);
      }
      throw error;
    }
    if (actual.rol !== 'DIRECTORA' && !observacion.esDe(actual.id)) {
      throw new AccesoDenegadoError(
        'Solo quien escribió la observación o la directora puede editarla.',
      );
    }
    return this.escritura.actualizar(id, {
      texto:
        cambios.texto === null
          ? null
          : normalizarTextoObservacion(cambios.texto),
      visibleAcudiente: cambios.visibleAcudiente,
    });
  }

  /** Respaldo del @Roles() del controlador: el acudiente y el estudiante no escriben. */
  private exigirPersonal(actual: UsuarioAutenticado): void {
    if (actual.rol !== 'DIRECTORA' && actual.rol !== 'TALLERISTA') {
      throw new AccesoDenegadoError(
        'Solo la directora o la tallerista escriben observaciones.',
      );
    }
  }
}
