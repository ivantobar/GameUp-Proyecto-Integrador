import {
  saltar,
  type Pagina,
  type Paginacion,
} from '../../src/common/paginacion/paginacion.js';
import type { AlcanceEstudiantes } from '../../src/modules/estudiantes/domain/alcance.js';
import {
  Estudiante,
  type CambioNivel,
  type PersonaResumen,
  type TalleristaAsignada,
  type VinculoAcudiente,
} from '../../src/modules/estudiantes/domain/estudiante.entity.js';
import type {
  AcudienteEstudianteRepository,
  EstudianteLecturaRepository,
  FiltroEstudiantes,
  NivelEstudianteRepository,
  TalleristaEstudianteRepository,
} from '../../src/modules/estudiantes/domain/estudiante.repository.js';
import { Usuario } from '../../src/modules/usuarios/domain/usuario.entity.js';
import type { UsuariosEnMemoria } from './usuarios-en-memoria.js';

export const NOMBRES_NIVEL: Record<string, string> = {
  '1': 'BAJO',
  '2': 'MEDIO',
  '3': 'ALTO',
};
export const FECHA_INGRESO = new Date('2026-02-03T00:00:00.000Z');

interface FilaTallerista {
  talleristaId: bigint;
  estudianteId: bigint;
  activo: boolean;
  fechaInicio: Date;
}

interface FilaAcudiente {
  acudienteId: bigint;
  estudianteId: bigint;
  parentesco: string;
  esPrincipal: boolean;
}

export interface VinculosIniciales {
  talleristas?: Array<{
    talleristaId: number;
    estudianteId: number;
    activo?: boolean;
  }>;
  acudientes?: Array<{
    acudienteId: number;
    estudianteId: number;
    parentesco?: string;
    esPrincipal?: boolean;
  }>;
}

/**
 * Implementación en memoria de los puertos de estudiantes (pruebas). Los
 * estudiantes y los nombres salen de UsuariosEnMemoria: un solo origen de
 * datos para login, usuarios y estudiantes. Los vínculos se exponen como dos
 * puertos aparte (`talleristasRepo`, `acudientesRepo`) con el mismo estado.
 */
export class EstudiantesEnMemoria
  implements EstudianteLecturaRepository, NivelEstudianteRepository
{
  readonly talleristasRepo: TalleristaEstudianteRepository;
  readonly acudientesRepo: AcudienteEstudianteRepository;

  readonly talleristas: FilaTallerista[] = [];
  readonly acudientes: FilaAcudiente[] = [];
  readonly historial: Array<CambioNivel & { estudianteId: bigint }> = [];
  /** Estudiantes cuyos acudientes fueron notificados de un cambio de nivel. */
  readonly notificados: bigint[] = [];
  private siguienteHistorial = 1n;

  constructor(
    private readonly usuarios: UsuariosEnMemoria,
    vinculos: VinculosIniciales = {},
  ) {
    for (const t of vinculos.talleristas ?? []) {
      this.talleristas.push({
        talleristaId: BigInt(t.talleristaId),
        estudianteId: BigInt(t.estudianteId),
        activo: t.activo ?? true,
        fechaInicio: FECHA_INGRESO,
      });
    }
    for (const a of vinculos.acudientes ?? []) {
      this.acudientes.push({
        acudienteId: BigInt(a.acudienteId),
        estudianteId: BigInt(a.estudianteId),
        parentesco: a.parentesco ?? 'Madre',
        esPrincipal: a.esPrincipal ?? false,
      });
    }
    this.talleristasRepo = talleristasEnMemoria(this.talleristas, (id) =>
      this.persona(id),
    );
    this.acudientesRepo = acudientesEnMemoria(this.acudientes, (id) =>
      this.persona(id),
    );
  }

  // ─── Apoyo ────────────────────────────────────────────────────────────────

  private persona(id: bigint): PersonaResumen {
    const u = this.usuarios.todos().find((x) => x.id === id);
    if (!u) throw new Error(`No existe el usuario ${id}`);
    return { id: u.id, nombres: u.nombres, apellidos: u.apellidos };
  }

  private aEstudiante(u: Usuario): Estudiante | null {
    if (u.rol !== 'ESTUDIANTE' || !u.estudiante) return null;
    return new Estudiante({
      id: u.id,
      nombres: u.nombres,
      apellidos: u.apellidos,
      cuentaActiva: u.activo,
      estado: u.estudiante.estado,
      nivel: {
        id: u.estudiante.nivelId,
        nombre: NOMBRES_NIVEL[u.estudiante.nivelId.toString()] ?? '?',
      },
      fechaIngreso: FECHA_INGRESO,
      personajeAvatar: null,
      idEstudianteExterno: u.estudiante.idEstudianteExterno,
    });
  }

  private todos(): Estudiante[] {
    return this.usuarios
      .todos()
      .map((u) => this.aEstudiante(u))
      .filter((e): e is Estudiante => e !== null);
  }

  private enAlcance(alcance: AlcanceEstudiantes, id: bigint): boolean {
    switch (alcance.tipo) {
      case 'todos':
        return true;
      case 'propio':
        return alcance.estudianteId === id;
      case 'tallerista':
        return this.talleristas.some(
          (t) =>
            t.talleristaId === alcance.talleristaId &&
            t.estudianteId === id &&
            t.activo,
        );
      case 'acudiente':
        return this.acudientes.some(
          (a) => a.acudienteId === alcance.acudienteId && a.estudianteId === id,
        );
    }
  }

  private pagina<T>(items: T[], p: Paginacion): Pagina<T> {
    const inicio = saltar(p);
    return {
      items: items.slice(inicio, inicio + p.limit),
      total: items.length,
      ...p,
    };
  }

  // ─── EstudianteLecturaRepository ──────────────────────────────────────────

  async buscarPorId(id: bigint): Promise<Estudiante | null> {
    return this.todos().find((e) => e.id === id) ?? null;
  }

  async listar(
    alcance: AlcanceEstudiantes,
    filtro: FiltroEstudiantes,
    paginacion: Paginacion,
  ): Promise<Pagina<Estudiante>> {
    const items = this.todos()
      .filter((e) => this.enAlcance(alcance, e.id))
      .filter((e) => filtro.estado === null || e.estado === filtro.estado)
      .filter((e) => filtro.nivelId === null || e.nivel.id === filtro.nivelId)
      .sort(
        (a, b) => a.nombres.localeCompare(b.nombres) || Number(a.id - b.id),
      );
    return this.pagina(items, paginacion);
  }

  async estaEnAlcance(
    alcance: AlcanceEstudiantes,
    id: bigint,
  ): Promise<boolean> {
    return (await this.buscarPorId(id)) !== null && this.enAlcance(alcance, id);
  }

  async historialNivel(
    id: bigint,
    p: Paginacion,
  ): Promise<Pagina<CambioNivel>> {
    const items = this.historial
      .filter((h) => h.estudianteId === id)
      .sort(
        (a, b) => b.fecha.getTime() - a.fecha.getTime() || Number(b.id - a.id),
      )
      .map(({ estudianteId: _e, ...cambio }) => cambio);
    return this.pagina(items, p);
  }

  // ─── NivelEstudianteRepository (simula cambiar_nivel) ─────────────────────

  async cambiarNivel(
    estudianteId: bigint,
    nivelId: bigint,
    directoraId: bigint,
    motivo: string | null,
  ): Promise<void> {
    const u = this.usuarios.todos().find((x) => x.id === estudianteId);
    if (!u?.estudiante) throw new Error('No existe el estudiante');
    this.usuarios.reemplazar(
      new Usuario({ ...u, estudiante: { ...u.estudiante, nivelId } }),
    );
    this.historial.push({
      id: this.siguienteHistorial++,
      estudianteId,
      nivel: { id: nivelId, nombre: NOMBRES_NIVEL[nivelId.toString()] ?? '?' },
      motivo,
      fecha: new Date(),
      asignadoPor: this.persona(directoraId),
    });
    this.notificados.push(estudianteId);
  }
}

type BuscarPersona = (id: bigint) => PersonaResumen;

function talleristasEnMemoria(
  filas: FilaTallerista[],
  persona: BuscarPersona,
): TalleristaEstudianteRepository {
  const encontrar = (t: bigint, e: bigint) =>
    filas.find((f) => f.talleristaId === t && f.estudianteId === e);
  const aDominio = (f: FilaTallerista): TalleristaAsignada => ({
    tallerista: persona(f.talleristaId),
    fechaInicio: f.fechaInicio,
    activo: f.activo,
  });
  return {
    async listar(estudianteId) {
      return filas
        .filter((f) => f.estudianteId === estudianteId)
        .sort((a, b) => Number(b.activo) - Number(a.activo))
        .map(aDominio);
    },
    async buscar(talleristaId, estudianteId) {
      const f = encontrar(talleristaId, estudianteId);
      return f ? aDominio(f) : null;
    },
    async activar(talleristaId, estudianteId, desde) {
      let f = encontrar(talleristaId, estudianteId);
      if (f) {
        f.activo = true;
        f.fechaInicio = desde;
      } else {
        f = { talleristaId, estudianteId, activo: true, fechaInicio: desde };
        filas.push(f);
      }
      return aDominio(f);
    },
    async desactivar(talleristaId, estudianteId) {
      const f = encontrar(talleristaId, estudianteId);
      if (!f?.activo) return false;
      f.activo = false;
      return true;
    },
  };
}

function acudientesEnMemoria(
  filas: FilaAcudiente[],
  persona: BuscarPersona,
): AcudienteEstudianteRepository {
  const encontrar = (a: bigint, e: bigint) =>
    filas.find((f) => f.acudienteId === a && f.estudianteId === e);
  const aDominio = (f: FilaAcudiente): VinculoAcudiente => ({
    acudiente: persona(f.acudienteId),
    parentesco: f.parentesco,
    esPrincipal: f.esPrincipal,
  });
  return {
    async listar(estudianteId) {
      return filas
        .filter((f) => f.estudianteId === estudianteId)
        .sort((a, b) => Number(b.esPrincipal) - Number(a.esPrincipal))
        .map(aDominio);
    },
    async buscar(acudienteId, estudianteId) {
      const f = encontrar(acudienteId, estudianteId);
      return f ? aDominio(f) : null;
    },
    async crear(acudienteId, estudianteId, parentesco, esPrincipal) {
      if (
        esPrincipal &&
        filas.some((f) => f.estudianteId === estudianteId && f.esPrincipal)
      ) {
        // Igual que el índice parcial uq_acudiente_principal de la base.
        throw new Error('uq_acudiente_principal');
      }
      const f = { acudienteId, estudianteId, parentesco, esPrincipal };
      filas.push(f);
      return aDominio(f);
    },
    async actualizar(acudienteId, estudianteId, cambios) {
      const f = encontrar(acudienteId, estudianteId);
      if (!f) throw new Error('No existe el vínculo');
      if (cambios.esPrincipal === true) {
        for (const otro of filas) {
          if (otro.estudianteId === estudianteId) otro.esPrincipal = false;
        }
      }
      if (cambios.parentesco !== null) f.parentesco = cambios.parentesco;
      if (cambios.esPrincipal !== null) f.esPrincipal = cambios.esPrincipal;
      return aDominio(f);
    },
    async eliminar(acudienteId, estudianteId) {
      const i = filas.findIndex(
        (f) => f.acudienteId === acudienteId && f.estudianteId === estudianteId,
      );
      if (i < 0) return false;
      filas.splice(i, 1);
      return true;
    },
  };
}
