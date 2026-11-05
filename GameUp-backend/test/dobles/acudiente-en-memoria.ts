import {
  saltar,
  type Paginacion,
} from '../../src/common/paginacion/paginacion.js';
import {
  Notificacion,
  type TipoNotificacion,
} from '../../src/modules/notificaciones/domain/notificacion.entity.js';
import type { NotificacionRepository } from '../../src/modules/notificaciones/domain/notificacion.repository.js';
import { Observacion } from '../../src/modules/observaciones/domain/observacion.entity.js';
import type {
  CambiosObservacion,
  NuevaObservacion,
  ObservacionEscrituraRepository,
  ObservacionLecturaRepository,
} from '../../src/modules/observaciones/domain/observacion.repository.js';
import type { PracticaCasaRepository } from '../../src/modules/practica-casa/domain/practica-casa.repository.js';
import { escenarioAsignaciones } from './asignaciones-en-memoria.js';
import type { EstudiantesEnMemoria } from './estudiantes-en-memoria.js';
import { AHORA_PRUEBA } from './modulos-en-memoria.js';
import type { UsuariosEnMemoria } from './usuarios-en-memoria.js';

function pagina<T>(todos: T[], p: Paginacion) {
  const inicio = saltar(p);
  return {
    items: todos.slice(inicio, inicio + p.limit),
    total: todos.length,
    ...p,
  };
}

// ─── Notificaciones ─────────────────────────────────────────────────────────

interface FilaNotificacion {
  id: bigint;
  usuarioId: bigint;
  tipo: TipoNotificacion;
  mensaje: string;
  leida: boolean;
  fecha: Date;
}

/** Notificaciones en memoria (pruebas). En la base las crean los triggers. */
export class NotificacionesEnMemoria implements NotificacionRepository {
  readonly filas: FilaNotificacion[] = [];
  private siguiente = 900n;

  /** Lo que haría fn_notificar_acudientes (u otro trigger). */
  agregar(
    usuarioId: bigint,
    tipo: TipoNotificacion,
    mensaje: string,
    fecha: Date = AHORA_PRUEBA,
  ): bigint {
    const id = this.siguiente++;
    this.filas.push({ id, usuarioId, tipo, mensaje, leida: false, fecha });
    return id;
  }

  private aEntidad(f: FilaNotificacion): Notificacion {
    return new Notificacion({
      id: f.id,
      tipo: f.tipo,
      mensaje: f.mensaje,
      leida: f.leida,
      fecha: f.fecha,
    });
  }

  async listar(usuarioId: bigint, leida: boolean | null, p: Paginacion) {
    const propias = this.filas
      .filter((f) => f.usuarioId === usuarioId)
      .filter((f) => leida === null || f.leida === leida)
      .sort(
        (a, b) => b.fecha.getTime() - a.fecha.getTime() || Number(b.id - a.id),
      )
      .map((f) => this.aEntidad(f));
    return pagina(propias, p);
  }

  async contarNoLeidas(usuarioId: bigint) {
    return this.filas.filter((f) => f.usuarioId === usuarioId && !f.leida)
      .length;
  }

  async marcarLeida(id: bigint, usuarioId: bigint) {
    const f = this.filas.find((x) => x.id === id && x.usuarioId === usuarioId);
    if (!f) return null;
    f.leida = true;
    return this.aEntidad(f);
  }

  async marcarTodasLeidas(usuarioId: bigint) {
    const pendientes = this.filas.filter(
      (f) => f.usuarioId === usuarioId && !f.leida,
    );
    for (const f of pendientes) f.leida = true;
    return pendientes.length;
  }
}

// ─── Observaciones ──────────────────────────────────────────────────────────

interface FilaObservacion {
  id: bigint;
  estudianteId: bigint;
  autorId: bigint;
  texto: string;
  visibleAcudiente: boolean;
  fecha: Date;
}

/**
 * Observaciones en memoria (pruebas). Simula trg_observacion_notificar: al
 * crearla visible, o al pasar de oculta a visible, avisa a los acudientes.
 */
export class ObservacionesEnMemoria
  implements ObservacionLecturaRepository, ObservacionEscrituraRepository
{
  readonly filas: FilaObservacion[] = [];
  private siguiente = 700n;

  constructor(
    private readonly usuarios: UsuariosEnMemoria,
    private readonly estudiantes: EstudiantesEnMemoria,
    private readonly notificaciones: NotificacionesEnMemoria,
  ) {}

  private aEntidad(f: FilaObservacion): Observacion {
    const autor = this.usuarios.todos().find((u) => u.id === f.autorId)!;
    return new Observacion({
      id: f.id,
      estudianteId: f.estudianteId,
      autor: {
        id: autor.id,
        nombres: autor.nombres,
        apellidos: autor.apellidos,
      },
      texto: f.texto,
      visibleAcudiente: f.visibleAcudiente,
      fecha: f.fecha,
    });
  }

  private async notificar(estudianteId: bigint): Promise<void> {
    const nino = this.usuarios.todos().find((u) => u.id === estudianteId)!;
    for (const v of await this.estudiantes.acudientesRepo.listar(
      estudianteId,
    )) {
      this.notificaciones.agregar(
        v.acudiente.id,
        'OBSERVACION',
        `Hay una nueva observación sobre ${nino.nombres}.`,
      );
    }
  }

  async buscarPorId(id: bigint) {
    const f = this.filas.find((x) => x.id === id);
    return f ? this.aEntidad(f) : null;
  }

  async listar(estudianteId: bigint, soloVisibles: boolean, p: Paginacion) {
    const filas = this.filas
      .filter((f) => f.estudianteId === estudianteId)
      .filter((f) => !soloVisibles || f.visibleAcudiente)
      .sort((a, b) => Number(b.id - a.id))
      .map((f) => this.aEntidad(f));
    return pagina(filas, p);
  }

  async crear(d: NuevaObservacion) {
    const fila: FilaObservacion = {
      id: this.siguiente++,
      ...d,
      fecha: AHORA_PRUEBA,
    };
    this.filas.push(fila);
    if (fila.visibleAcudiente) await this.notificar(fila.estudianteId);
    return this.aEntidad(fila);
  }

  async actualizar(id: bigint, c: CambiosObservacion) {
    const f = this.filas.find((x) => x.id === id)!;
    const eraVisible = f.visibleAcudiente;
    if (c.texto !== null) f.texto = c.texto;
    if (c.visibleAcudiente !== null) f.visibleAcudiente = c.visibleAcudiente;
    if (f.visibleAcudiente && !eraVisible) await this.notificar(f.estudianteId);
    return this.aEntidad(f);
  }
}

// ─── Práctica en casa ───────────────────────────────────────────────────────

/** practica_casa en memoria (pruebas). Simula la PK: no duplica el día. */
export class PracticasEnMemoria implements PracticaCasaRepository {
  readonly filas: Array<{
    estudianteId: bigint;
    acudienteId: bigint;
    fecha: string;
  }> = [];

  async registrar(estudianteId: bigint, acudienteId: bigint, fecha: string) {
    const existe = this.filas.some(
      (f) =>
        f.estudianteId === estudianteId &&
        f.acudienteId === acudienteId &&
        f.fecha === fecha,
    );
    if (!existe) this.filas.push({ estudianteId, acudienteId, fecha });
  }

  async diasPracticados(estudianteId: bigint, desde: string, hasta: string) {
    return [
      ...new Set(
        this.filas
          .filter(
            (f) =>
              f.estudianteId === estudianteId &&
              f.fecha >= desde &&
              f.fecha <= hasta,
          )
          .map((f) => f.fecha),
      ),
    ].sort();
  }
}

/**
 * Escenario de la fase 8 sobre el de asignaciones. Además de lo de
 * escenario-estudiantes: avisos ya creados para el acudiente 4 (uno leído) y
 * uno para el acudiente 5.
 */
export async function escenarioAcudiente() {
  const base = await escenarioAsignaciones();
  const notificaciones = new NotificacionesEnMemoria();
  const observaciones = new ObservacionesEnMemoria(
    base.usuarios,
    base.estudiantes,
    notificaciones,
  );
  const practicas = new PracticasEnMemoria();
  const n1 = notificaciones.agregar(
    4n,
    'NUEVO_MODULO',
    'Hay un módulo nuevo para Martín José.',
    new Date('2026-11-04T15:00:00Z'),
  );
  const n2 = notificaciones.agregar(
    4n,
    'AVANCE',
    'Martín José completó un módulo.',
    new Date('2026-11-03T15:00:00Z'),
  );
  notificaciones.filas.find((f) => f.id === n2)!.leida = true;
  const n3 = notificaciones.agregar(
    5n,
    'NIVEL',
    'Lucas cambió de nivel.',
    new Date('2026-11-04T16:00:00Z'),
  );
  return {
    ...base,
    notificaciones,
    observaciones,
    practicas,
    ids: { ...base.ids, n1, n2, n3 },
  };
}
