import { Inject, Injectable } from '@nestjs/common';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import { ReglaNegocioError } from '../../../common/errors/dominio.errors.js';
import type {
  Pagina,
  Paginacion,
} from '../../../common/paginacion/paginacion.js';
import {
  NIVEL_CONSULTA,
  type NivelConsulta,
} from '../../usuarios/domain/usuario.repository.js';
import { alcanceDe } from '../domain/alcance.js';
import type { CambioNivel, Estudiante } from '../domain/estudiante.entity.js';
import {
  ESTUDIANTE_LECTURA_REPOSITORY,
  NIVEL_ESTUDIANTE_REPOSITORY,
  type EstudianteLecturaRepository,
  type FiltroEstudiantes,
  type NivelEstudianteRepository,
} from '../domain/estudiante.repository.js';
import { AccesoEstudianteService } from './acceso-estudiante.service.js';

/** Casos de uso de lectura de estudiantes y cambio de nivel. */
@Injectable()
export class EstudianteService {
  constructor(
    @Inject(ESTUDIANTE_LECTURA_REPOSITORY)
    private readonly estudiantes: EstudianteLecturaRepository,
    @Inject(NIVEL_ESTUDIANTE_REPOSITORY)
    private readonly niveles: NivelEstudianteRepository,
    @Inject(NIVEL_CONSULTA) private readonly catalogoNiveles: NivelConsulta,
    private readonly acceso: AccesoEstudianteService,
  ) {}

  /** Los estudiantes que esta persona puede ver (directora: todos). */
  listar(
    actual: UsuarioAutenticado,
    filtro: FiltroEstudiantes,
    paginacion: Paginacion,
  ): Promise<Pagina<Estudiante>> {
    return this.estudiantes.listar(alcanceDe(actual), filtro, paginacion);
  }

  obtener(actual: UsuarioAutenticado, id: bigint): Promise<Estudiante> {
    return this.acceso.obtenerVisible(actual, id);
  }

  /** El estudiante con sesión. */
  obtenerPropio(actual: UsuarioAutenticado): Promise<Estudiante> {
    return this.acceso.obtenerVisible(actual, actual.id);
  }

  async historialNivel(
    actual: UsuarioAutenticado,
    id: bigint,
    paginacion: Paginacion,
  ): Promise<Pagina<CambioNivel>> {
    await this.acceso.verificar(actual, id);
    return this.estudiantes.historialNivel(id, paginacion);
  }

  /**
   * Solo la directora (lo exige el controlador). Usa la función cambiar_nivel
   * de la base, que guarda el historial y avisa a los acudientes.
   */
  async cambiarNivel(
    actual: UsuarioAutenticado,
    id: bigint,
    nivelId: bigint,
    motivo: string | null,
  ): Promise<Estudiante> {
    const estudiante = await this.acceso.existente(id);
    if (!(await this.catalogoNiveles.existe(nivelId))) {
      throw new ReglaNegocioError('El nivel indicado no existe.');
    }
    if (estudiante.nivel.id === nivelId) {
      throw new ReglaNegocioError('El estudiante ya está en ese nivel.');
    }
    const motivoLimpio = motivo?.trim() || null;
    await this.niveles.cambiarNivel(id, nivelId, actual.id, motivoLimpio);
    return this.acceso.existente(id);
  }
}
