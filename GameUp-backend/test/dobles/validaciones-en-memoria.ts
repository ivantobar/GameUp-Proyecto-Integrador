import { saltar } from '../../src/common/paginacion/paginacion.js';
import type { Configuracion } from '../../src/modules/catalogo/domain/juegos/estrategia-juego.js';
import type {
  DecisionValidacion,
  GrabacionGuardada,
  ItemRevision,
} from '../../src/modules/validaciones/domain/validacion.js';
import type {
  AlcanceRevision,
  GrabacionRepository,
  RevisionLecturaRepository,
  ValidacionEscrituraRepository,
} from '../../src/modules/validaciones/domain/validacion.repository.js';
import type { AsignacionesEnMemoria } from './asignaciones-en-memoria.js';
import type { EstudiantesEnMemoria } from './estudiantes-en-memoria.js';
import { escenarioIntentos, type FilaIntento } from './intentos-en-memoria.js';
import type { ModulosEnMemoria } from './modulos-en-memoria.js';
import type { UsuariosEnMemoria } from './usuarios-en-memoria.js';

/**
 * Validaciones y grabaciones en memoria (pruebas). Simula los triggers de la
 * base: una sola validación por intento y el recálculo del progreso
 * (fn_recalcular_progreso), con el paso a COMPLETADO.
 */
export class ValidacionesEnMemoria
  implements
    RevisionLecturaRepository,
    ValidacionEscrituraRepository,
    GrabacionRepository
{
  /** Validadores que escribieron (para comprobar quién validó). */
  readonly validadores = new Map<bigint, bigint>();

  constructor(
    private readonly usuarios: UsuariosEnMemoria,
    private readonly estudiantes: EstudiantesEnMemoria,
    private readonly modulos: ModulosEnMemoria,
    private readonly asignaciones: AsignacionesEnMemoria,
  ) {}

  private get filas(): FilaIntento[] {
    return this.asignaciones.intentosFilas as FilaIntento[];
  }

  private asignacion(id: bigint) {
    return this.asignaciones.filas.find((a) => a.id === id)!;
  }

  private actividad(id: bigint) {
    return this.modulos.actividades.find((a) => a.id === id)!;
  }

  // ─── Bandeja ──────────────────────────────────────────────────────────────

  async pendientes(
    alcance: AlcanceRevision,
    estudianteId: bigint | null,
    p: { page: number; limit: number },
  ) {
    const visibles: FilaIntento[] = [];
    for (const f of this.filas.filter(
      (x) => x.id !== undefined && x.validacion === null,
    )) {
      const est = this.asignacion(f.asignacionId).estudianteId;
      if (estudianteId !== null && est !== estudianteId) continue;
      const enAlcance =
        alcance.tipo === 'todos' ||
        (await this.estudiantes.estaEnAlcance(alcance, est));
      if (enAlcance) visibles.push(f);
    }
    const items = visibles.map((f): ItemRevision => {
      const actividad = this.actividad(f.actividadId);
      const modulo = this.modulos.modulos.find(
        (m) => m.id === actividad.moduloId,
      )!;
      const u = this.usuarios
        .todos()
        .find((x) => x.id === this.asignacion(f.asignacionId).estudianteId)!;
      const vocal = actividad.configuracion['vocal'];
      return {
        intentoId: f.id!,
        numeroIntento: f.numeroIntento,
        fecha: f.fecha,
        tipoJuego: actividad.tipoJuego.codigo,
        resultado: (f.resultado ?? {}) as Configuracion,
        estudiante: { id: u.id, nombres: u.nombres, apellidos: u.apellidos },
        actividad: {
          id: actividad.id,
          titulo: actividad.titulo,
          vocal: typeof vocal === 'string' ? vocal : null,
        },
        modulo: { id: modulo.id, nombre: modulo.nombre },
        pendientesMismaActividad: visibles.filter(
          (o) =>
            o.asignacionId === f.asignacionId &&
            o.actividadId === f.actividadId,
        ).length,
        grabacion: f.grabacion
          ? {
              disponible: f.grabacion.eliminadaEn === null,
              vencido: f.grabacion.eliminadaEn !== null,
            }
          : null,
      };
    });
    const inicio = saltar(p);
    return {
      items: items.slice(inicio, inicio + p.limit),
      total: items.length,
      ...p,
    };
  }

  // ─── Validaciones (con el recálculo de progreso de la base) ──────────────

  async validar(
    intentoId: bigint,
    validadorId: bigint,
    d: DecisionValidacion,
  ): Promise<void> {
    const f = this.filas.find((x) => x.id === intentoId)!;
    if (f.validacion) throw new Error('validacion_intento_id_key'); // único en la base
    f.validacion = {
      resultado: d.resultado,
      retroalimentacion: d.retroalimentacion,
    };
    this.validadores.set(intentoId, validadorId);
    this.recalcular(f.asignacionId);
  }

  async aprobarLote(ids: bigint[], validadorId: bigint): Promise<number> {
    if (ids.some((id) => this.filas.find((x) => x.id === id)?.validacion)) {
      throw new Error('validacion_intento_id_key'); // la transacción no deja ninguna
    }
    for (const id of ids)
      await this.validar(id, validadorId, {
        resultado: 'APROBADO',
        retroalimentacion: null,
      });
    return ids.length;
  }

  /** Como fn_recalcular_progreso: actividades activas con algún APROBADO. */
  private recalcular(asignacionId: bigint): void {
    const a = this.asignacion(asignacionId);
    const activas = this.modulos.actividades.filter(
      (x) => x.moduloId === a.moduloId && x.activa,
    );
    const aprobadas = new Set(
      this.filas
        .filter(
          (f) =>
            f.asignacionId === asignacionId &&
            f.validacion?.resultado === 'APROBADO',
        )
        .map((f) => f.actividadId),
    );
    const n = activas.filter((x) => aprobadas.has(x.id)).length;
    const progreso =
      activas.length === 0
        ? 0
        : Math.min(100, Math.round((100 * n) / activas.length));
    this.asignaciones.cambiarEstado(
      asignacionId,
      activas.length > 0 && progreso >= 100
        ? 'COMPLETADO'
        : a.estado === 'COMPLETADO'
          ? 'EN_CURSO'
          : a.estado,
      progreso,
    );
  }

  // ─── Grabaciones ──────────────────────────────────────────────────────────

  private aGrabacion(f: FilaIntento): GrabacionGuardada | null {
    const g = f.grabacion;
    if (!g?.ruta) return null;
    return {
      id: g.id,
      intentoId: f.id!,
      ruta: g.ruta,
      creadaEn: g.creadaEn!,
      eliminadaEn: g.eliminadaEn,
    };
  }

  private todas(): GrabacionGuardada[] {
    return this.filas
      .map((f) => this.aGrabacion(f))
      .filter((g): g is GrabacionGuardada => g !== null);
  }

  async buscarPorIntento(intentoId: bigint) {
    const f = this.filas.find((x) => x.id === intentoId);
    return f ? this.aGrabacion(f) : null;
  }

  /** Como la vista grabacion_por_eliminar. */
  async validadasSinBorrar(limite: number) {
    return this.todas()
      .filter(
        (g) =>
          g.eliminadaEn === null &&
          this.filas.find((f) => f.id === g.intentoId)?.validacion,
      )
      .slice(0, limite);
  }

  async vencidas(antesDe: Date, limite: number) {
    return this.todas()
      .filter(
        (g) =>
          g.eliminadaEn === null &&
          g.creadaEn < antesDe &&
          !this.filas.find((f) => f.id === g.intentoId)?.validacion,
      )
      .slice(0, limite);
  }

  async marcarEliminadas(ids: bigint[], fecha: Date) {
    for (const f of this.filas) {
      if (
        f.grabacion &&
        ids.includes(f.grabacion.id) &&
        f.grabacion.eliminadaEn === null
      ) {
        f.grabacion.eliminadaEn = fecha;
      }
    }
  }
}

/** Escenario de la fase 7 sobre el de intentos (ver intentos-en-memoria). */
export async function escenarioValidaciones() {
  const base = await escenarioIntentos();
  const validaciones = new ValidacionesEnMemoria(
    base.usuarios,
    base.estudiantes,
    base.modulos,
    base.asignaciones,
  );
  return { ...base, validaciones };
}
