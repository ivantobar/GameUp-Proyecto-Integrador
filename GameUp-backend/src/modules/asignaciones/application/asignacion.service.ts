import { Inject, Injectable } from '@nestjs/common';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import {
  ConflictoError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../../../common/errors/dominio.errors.js';
import { aFechaSinHora, fechaEnBogota } from '../../../common/fechas/fechas.js';
import type {
  Pagina,
  Paginacion,
} from '../../../common/paginacion/paginacion.js';
import { RELOJ, type Reloj } from '../../../common/reloj/reloj.js';
import { AccesoEstudianteService } from '../../estudiantes/application/acceso-estudiante.service.js';
import { alcanceDe } from '../../estudiantes/domain/alcance.js';
import {
  MODULO_REPOSITORY,
  type ModuloRepository,
} from '../../modulos/domain/modulo.repository.js';
import type { Asignacion } from '../domain/asignacion.entity.js';
import {
  ASIGNACION_ESCRITURA_REPOSITORY,
  ASIGNACION_LECTURA_REPOSITORY,
  type AsignacionEscrituraRepository,
  type AsignacionLecturaRepository,
  type FiltroAsignaciones,
} from '../domain/asignacion.repository.js';

export const MENSAJE_ASIGNACION_NO_EXISTE = 'La asignación no existe.';

export interface DatosAsignacion {
  moduloId: bigint;
  estudianteId: bigint;
  /** "AAAA-MM-DD" o null. */
  fechaSugerida: string | null;
}

/**
 * Asignar módulos a estudiantes. Directora: a cualquiera; tallerista: solo a
 * los que tiene a cargo (si no, 404). La base vuelve a exigir lo mismo con
 * triggers (rol, vínculo, módulo publicado) y avisa a los acudientes.
 */
@Injectable()
export class AsignacionService {
  constructor(
    @Inject(ASIGNACION_LECTURA_REPOSITORY)
    private readonly lectura: AsignacionLecturaRepository,
    @Inject(ASIGNACION_ESCRITURA_REPOSITORY)
    private readonly escritura: AsignacionEscrituraRepository,
    @Inject(MODULO_REPOSITORY) private readonly modulos: ModuloRepository,
    @Inject(RELOJ) private readonly reloj: Reloj,
    private readonly acceso: AccesoEstudianteService,
  ) {}

  async crear(
    actual: UsuarioAutenticado,
    datos: DatosAsignacion,
  ): Promise<Asignacion> {
    const estudiante = await this.acceso.obtenerVisible(
      actual,
      datos.estudianteId,
    );
    if (!estudiante.estaActivo()) {
      throw new ReglaNegocioError(
        'Solo se asignan módulos a estudiantes activos.',
      );
    }

    const modulo = await this.modulos.buscarPorId(datos.moduloId);
    if (!modulo) throw new ReglaNegocioError('El módulo indicado no existe.');
    if (!modulo.publicado) {
      throw new ReglaNegocioError('Solo se pueden asignar módulos publicados.');
    }

    if (await this.lectura.existeActiva(datos.moduloId, datos.estudianteId)) {
      throw new ConflictoError(
        'El estudiante ya tiene este módulo asignado y sin completar.',
      );
    }

    let fechaSugerida: Date | null = null;
    if (datos.fechaSugerida !== null) {
      const hoy = fechaEnBogota(this.reloj.ahora());
      // Las fechas AAAA-MM-DD se comparan bien como texto.
      if (datos.fechaSugerida < hoy) {
        throw new ReglaNegocioError(
          'La fecha sugerida no puede ser anterior a hoy.',
        );
      }
      fechaSugerida = aFechaSinHora(datos.fechaSugerida);
    }

    return this.escritura.crear({
      moduloId: datos.moduloId,
      estudianteId: datos.estudianteId,
      asignadoPor: actual.id,
      fechaSugerida,
    });
  }

  /** Las asignaciones de los estudiantes que esta persona puede ver. */
  listar(
    actual: UsuarioAutenticado,
    filtro: FiltroAsignaciones,
    paginacion: Paginacion,
  ): Promise<Pagina<Asignacion>> {
    return this.lectura.listar(alcanceDe(actual), filtro, paginacion);
  }

  /** 404 si no existe o el estudiante no le corresponde. */
  async obtener(actual: UsuarioAutenticado, id: bigint): Promise<Asignacion> {
    const asignacion = await this.lectura.buscarPorId(id);
    if (!asignacion)
      throw new RecursoNoEncontradoError(MENSAJE_ASIGNACION_NO_EXISTE);
    await this.acceso
      .verificar(actual, asignacion.estudiante.id)
      .catch((error: unknown) => {
        throw error instanceof RecursoNoEncontradoError
          ? new RecursoNoEncontradoError(MENSAJE_ASIGNACION_NO_EXISTE)
          : error;
      });
    return asignacion;
  }

  /** Solo sin intentos: los intentos son historial del estudiante (la base los borraría en cascada). */
  async eliminar(actual: UsuarioAutenticado, id: bigint): Promise<void> {
    const asignacion = await this.obtener(actual, id);
    const intentos = (await this.lectura.intentos([id])).get(id) ?? [];
    if (intentos.length > 0) {
      throw new ConflictoError(
        'La asignación ya tiene intentos del estudiante y no se puede eliminar.',
      );
    }
    await this.escritura.eliminar(asignacion.id);
  }
}
