import { Inject, Injectable } from '@nestjs/common';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import { AccesoDenegadoError } from '../../../common/errors/dominio.errors.js';
import type { Actividad } from '../../modulos/domain/modulo.entity.js';
import {
  ACTIVIDAD_REPOSITORY,
  type ActividadRepository,
} from '../../modulos/domain/modulo.repository.js';
import {
  avanceDe,
  estaPorHacer,
  type ActividadAsignada,
  type Asignacion,
  type AvanceActividad,
} from '../domain/asignacion.entity.js';
import {
  ASIGNACION_LECTURA_REPOSITORY,
  type AsignacionLecturaRepository,
} from '../domain/asignacion.repository.js';
import { AccesoEstudianteService } from '../../estudiantes/application/acceso-estudiante.service.js';
import { AsignacionService } from './asignacion.service.js';

export interface ResumenAvance {
  total: number;
  aprobadas: number;
  pendientesValidacion: number;
}

export interface DetalleAsignacion {
  asignacion: Asignacion;
  actividades: AvanceActividad[];
  resumen: ResumenAvance;
}

/** Progreso oficial de un estudiante: una entrada por asignación. */
export interface ProgresoOficial {
  modulos: Array<{ asignacion: Asignacion; resumen: ResumenAvance }>;
  /** Actividades que esperan validación (todos los módulos): se informan aparte y no suman. */
  pendientesValidacion: number;
}

export interface ActividadPendiente {
  asignacion: Asignacion;
  avance: AvanceActividad;
}

function aActividadAsignada(a: Actividad): ActividadAsignada {
  return {
    id: a.id,
    titulo: a.titulo,
    tipoJuego: a.tipoJuego.codigo,
    configuracion: a.configuracion,
    orden: a.orden,
  };
}

/**
 * Avance de una asignación: estado de cada actividad ACTIVA (las inactivas
 * no cuentan para el progreso, igual que en la base).
 */
@Injectable()
export class AvanceAsignacionService {
  constructor(
    @Inject(ASIGNACION_LECTURA_REPOSITORY)
    private readonly lectura: AsignacionLecturaRepository,
    @Inject(ACTIVIDAD_REPOSITORY)
    private readonly actividades: ActividadRepository,
    private readonly asignaciones: AsignacionService,
    private readonly acceso: AccesoEstudianteService,
  ) {}

  /**
   * Progreso oficial por módulo: solo cuentan las actividades activas con
   * un intento APROBADO (igual que la base). Las pendientes se informan
   * aparte. Directora, tallerista a cargo, acudiente o el propio estudiante.
   */
  async progreso(
    actual: UsuarioAutenticado,
    estudianteId: bigint,
  ): Promise<ProgresoOficial> {
    await this.acceso.verificar(actual, estudianteId);
    const pagina = await this.lectura.listar(
      { tipo: 'todos' },
      { estudianteId, moduloId: null, estado: null },
      { page: 1, limit: 50 },
    );
    const intentos = await this.lectura.intentos(pagina.items.map((a) => a.id));
    const modulos: ProgresoOficial['modulos'] = [];
    for (const asignacion of pagina.items) {
      const actividades = await this.actividades.listar(
        asignacion.modulo.id,
        true,
      );
      const avances = actividades.map((a) =>
        avanceDe(aActividadAsignada(a), intentos.get(asignacion.id) ?? []),
      );
      modulos.push({ asignacion, resumen: resumir(avances) });
    }
    return {
      modulos,
      pendientesValidacion: modulos.reduce(
        (n, m) => n + m.resumen.pendientesValidacion,
        0,
      ),
    };
  }

  async detalle(
    actual: UsuarioAutenticado,
    id: bigint,
  ): Promise<DetalleAsignacion> {
    const asignacion = await this.asignaciones.obtener(actual, id);
    const [actividades, intentos] = await Promise.all([
      this.actividades.listar(asignacion.modulo.id, true),
      this.lectura.intentos([id]),
    ]);
    const avances = actividades.map((a) =>
      avanceDe(aActividadAsignada(a), intentos.get(id) ?? []),
    );
    return { asignacion, actividades: avances, resumen: resumir(avances) };
  }

  /**
   * Lo que el estudiante con sesión tiene por hacer: actividades activas de
   * sus asignaciones sin completar que aún no hizo o que le pidieron repetir.
   */
  async pendientesDelEstudiante(
    actual: UsuarioAutenticado,
  ): Promise<ActividadPendiente[]> {
    if (actual.rol !== 'ESTUDIANTE') {
      throw new AccesoDenegadoError(
        'Solo el estudiante consulta sus actividades pendientes.',
      );
    }
    const asignaciones = await this.lectura.activasDelEstudiante(actual.id);
    if (asignaciones.length === 0) return [];
    const intentos = await this.lectura.intentos(asignaciones.map((a) => a.id));

    const pendientes: ActividadPendiente[] = [];
    for (const asignacion of asignaciones) {
      const actividades = await this.actividades.listar(
        asignacion.modulo.id,
        true,
      );
      for (const actividad of actividades) {
        const avance = avanceDe(
          aActividadAsignada(actividad),
          intentos.get(asignacion.id) ?? [],
        );
        if (estaPorHacer(avance)) pendientes.push({ asignacion, avance });
      }
    }
    return pendientes;
  }
}

function resumir(avances: AvanceActividad[]): ResumenAvance {
  return {
    total: avances.length,
    aprobadas: avances.filter((a) => a.estado === 'APROBADA').length,
    pendientesValidacion: avances.filter(
      (a) => a.estado === 'PENDIENTE_VALIDACION',
    ).length,
  };
}
