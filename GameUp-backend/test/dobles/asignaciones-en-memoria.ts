import { saltar } from '../../src/common/paginacion/paginacion.js';
import {
  Asignacion,
  type EstadoAsignacion,
  type IntentoResumen,
} from '../../src/modules/asignaciones/domain/asignacion.entity.js';
import type {
  AsignacionEscrituraRepository,
  AsignacionLecturaRepository,
  NuevaAsignacion,
} from '../../src/modules/asignaciones/domain/asignacion.repository.js';
import type { PersonaResumen } from '../../src/modules/estudiantes/domain/estudiante.entity.js';
import type { EstudiantesEnMemoria } from './estudiantes-en-memoria.js';
import { escenarioModulos } from './escenario-modulos.js';
import { AHORA_PRUEBA, type ModulosEnMemoria } from './modulos-en-memoria.js';
import type { UsuariosEnMemoria } from './usuarios-en-memoria.js';

interface FilaAsignacion {
  id: bigint;
  moduloId: bigint;
  estudianteId: bigint;
  asignadoPor: bigint;
  fechaSugerida: Date | null;
  estado: EstadoAsignacion;
  progreso: number;
}

/**
 * Asignaciones en memoria (pruebas). Comparte la lista con ModulosEnMemoria
 * para que «módulo asignado» signifique lo mismo en contenidos y asignaciones.
 */
export class AsignacionesEnMemoria
  implements AsignacionLecturaRepository, AsignacionEscrituraRepository
{
  readonly filas: FilaAsignacion[] = [];
  readonly intentosFilas: Array<IntentoResumen & { asignacionId: bigint }> = [];
  private siguiente = 500n;

  constructor(
    private readonly usuarios: UsuariosEnMemoria,
    private readonly estudiantes: EstudiantesEnMemoria,
    private readonly modulos: ModulosEnMemoria,
  ) {
    // Las asignaciones que ya traía el escenario de módulos.
    for (const a of modulos.asignaciones) {
      this.filas.push({
        id: this.siguiente++,
        moduloId: a.moduloId,
        estudianteId: a.estudianteId,
        asignadoPor: 1n,
        fechaSugerida: null,
        estado: 'ASIGNADO',
        progreso: 0,
      });
    }
  }

  /** Simula un intento (y opcionalmente su validación). */
  registrarIntento(
    asignacionId: bigint,
    actividadId: bigint,
    validacion: IntentoResumen['validacion'] = null,
  ): void {
    const numero =
      this.intentosFilas.filter(
        (i) => i.asignacionId === asignacionId && i.actividadId === actividadId,
      ).length + 1;
    this.intentosFilas.push({
      asignacionId,
      actividadId,
      numeroIntento: numero,
      fecha: AHORA_PRUEBA,
      validacion,
    });
    this.modulos.actividadesConIntentos.add(actividadId);
  }

  cambiarEstado(id: bigint, estado: EstadoAsignacion, progreso = 0): void {
    const f = this.filas.find((x) => x.id === id)!;
    f.estado = estado;
    f.progreso = progreso;
  }

  private persona(id: bigint): PersonaResumen {
    const u = this.usuarios.todos().find((x) => x.id === id)!;
    return { id: u.id, nombres: u.nombres, apellidos: u.apellidos };
  }

  private aEntidad(f: FilaAsignacion): Asignacion {
    const modulo = this.modulos.modulos.find((m) => m.id === f.moduloId)!;
    return new Asignacion({
      id: f.id,
      modulo: { id: modulo.id, nombre: modulo.nombre },
      estudiante: this.persona(f.estudianteId),
      asignadoPor: this.persona(f.asignadoPor),
      fechaAsignacion: AHORA_PRUEBA,
      fechaSugerida: f.fechaSugerida,
      estado: f.estado,
      progreso: f.progreso,
    });
  }

  async buscarPorId(id: bigint) {
    const f = this.filas.find((x) => x.id === id);
    return f ? this.aEntidad(f) : null;
  }

  async listar(
    alcance: Parameters<AsignacionLecturaRepository['listar']>[0],
    filtro: Parameters<AsignacionLecturaRepository['listar']>[1],
    p: Parameters<AsignacionLecturaRepository['listar']>[2],
  ) {
    const visibles: FilaAsignacion[] = [];
    for (const f of this.filas) {
      if (await this.estudiantes.estaEnAlcance(alcance, f.estudianteId))
        visibles.push(f);
    }
    const items = visibles
      .filter(
        (f) =>
          filtro.estudianteId === null ||
          f.estudianteId === filtro.estudianteId,
      )
      .filter((f) => filtro.moduloId === null || f.moduloId === filtro.moduloId)
      .filter((f) => filtro.estado === null || f.estado === filtro.estado)
      .sort((a, b) => Number(b.id - a.id))
      .map((f) => this.aEntidad(f));
    const inicio = saltar(p);
    return {
      items: items.slice(inicio, inicio + p.limit),
      total: items.length,
      ...p,
    };
  }

  async activasDelEstudiante(estudianteId: bigint) {
    return this.filas
      .filter(
        (f) => f.estudianteId === estudianteId && f.estado !== 'COMPLETADO',
      )
      .map((f) => this.aEntidad(f));
  }

  async existeActiva(moduloId: bigint, estudianteId: bigint) {
    return this.filas.some(
      (f) =>
        f.moduloId === moduloId &&
        f.estudianteId === estudianteId &&
        f.estado !== 'COMPLETADO',
    );
  }

  async intentos(ids: bigint[]) {
    return new Map(
      ids.map((id) => [
        id,
        this.intentosFilas
          .filter((i) => i.asignacionId === id)
          .map(({ asignacionId: _a, ...i }) => i),
      ]),
    );
  }

  async crear(d: NuevaAsignacion) {
    const f: FilaAsignacion = {
      id: this.siguiente++,
      ...d,
      estado: 'ASIGNADO',
      progreso: 0,
    };
    this.filas.push(f);
    this.modulos.asignaciones.push({
      moduloId: d.moduloId,
      estudianteId: d.estudianteId,
    });
    return this.aEntidad(f);
  }

  async eliminar(id: bigint) {
    const f = this.filas.find((x) => x.id === id)!;
    this.filas.splice(this.filas.indexOf(f), 1);
    const i = this.modulos.asignaciones.findIndex(
      (a) => a.moduloId === f.moduloId && a.estudianteId === f.estudianteId,
    );
    if (i >= 0) this.modulos.asignaciones.splice(i, 1);
  }
}

/**
 * Escenario de la fase 5 sobre el de módulos (ver escenario-modulos):
 *   Asignación A1: módulo 1 → estudiante 10. HABLA_CONMIGO con un intento
 *       rechazado y otro pendiente de validación.
 *   Módulo 4 «Vocales y parejas»: de la directora, PUBLICADO, con tres
 *       actividades activas (HABLA_CONMIGO «e», EMPAREJAR, MEMORIA).
 *   Asignación A4: módulo 4 → estudiante 10, fecha sugerida 2026-11-20.
 *       EMPAREJAR rechazada («Mira bien las parejas»), MEMORIA aprobada,
 *       HABLA_CONMIGO sin intentos.
 */
export async function escenarioAsignaciones() {
  const base = escenarioModulos();
  const { modulos } = base;
  const m4 = await modulos.moduloRepo.crear(
    {
      categoriaId: 1n,
      nivelId: 1n,
      musicaId: null,
      nombre: 'Vocales y parejas',
      descripcion: null,
      orden: 4,
    },
    1n,
  );
  await modulos.moduloRepo.cambiarPublicado(m4.id, true);
  const hablaE = modulos.agregarActividad(Number(m4.id), 'HABLA_CONMIGO');
  hablaE.configuracion = { vocal: 'e' };
  const emparejar = modulos.agregarActividad(Number(m4.id), 'EMPAREJAR');
  const memoria = modulos.agregarActividad(Number(m4.id), 'MEMORIA');

  const asignaciones = new AsignacionesEnMemoria(
    base.usuarios,
    base.estudiantes,
    modulos,
  );
  const a1 = asignaciones.filas[0]!.id;
  const a4 = (
    await asignaciones.crear({
      moduloId: m4.id,
      estudianteId: 10n,
      asignadoPor: 1n,
      fechaSugerida: new Date('2026-11-20T00:00:00Z'),
    })
  ).id;

  asignaciones.registrarIntento(a1, base.ids.habla, {
    resultado: 'RECHAZADO',
    retroalimentacion: 'Abre más la boca',
  });
  asignaciones.registrarIntento(a1, base.ids.habla);
  asignaciones.registrarIntento(a4, emparejar.id, {
    resultado: 'RECHAZADO',
    retroalimentacion: 'Mira bien las parejas',
  });
  asignaciones.registrarIntento(a4, memoria.id, {
    resultado: 'APROBADO',
    retroalimentacion: null,
  });

  return {
    ...base,
    asignaciones,
    ids: {
      ...base.ids,
      modulo4: m4.id,
      hablaE: hablaE.id,
      emparejar: emparejar.id,
      memoria: memoria.id,
      a1,
      a4,
    },
  };
}
