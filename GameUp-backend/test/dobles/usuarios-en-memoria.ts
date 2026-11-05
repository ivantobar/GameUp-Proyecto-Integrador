import type { RolGameUp } from '../../src/common/auth/usuario-autenticado.js';
import {
  saltar,
  type Pagina,
  type Paginacion,
} from '../../src/common/paginacion/paginacion.js';
import { Cuenta } from '../../src/modules/auth/domain/cuenta.entity.js';
import type { CuentaRepository } from '../../src/modules/auth/domain/cuenta.repository.js';
import type { CopiaExterna } from '../../src/modules/usuarios/domain/copia-externa.js';
import type { DatosNuevoUsuario } from '../../src/modules/usuarios/domain/nuevo-usuario.js';
import {
  Usuario,
  type PropiedadesUsuario,
} from '../../src/modules/usuarios/domain/usuario.entity.js';
import type {
  CampoUnico,
  FiltroUsuarios,
  NivelConsulta,
  ResultadoCambioActivo,
  UsuarioEscrituraRepository,
  UsuarioLecturaRepository,
} from '../../src/modules/usuarios/domain/usuario.repository.js';

export const CREADO_EN = new Date('2026-11-01T10:00:00Z');

/** Usuario ficticio para pruebas (sin datos reales). */
export function usuarioDePrueba(
  id: number,
  rol: RolGameUp,
  extra: Partial<PropiedadesUsuario> = {},
): Usuario {
  return new Usuario({
    id: BigInt(id),
    idUsuarioAuth: BigInt(id * 100),
    rol,
    nombres: `Nombre${id}`,
    apellidos: `Apellido${id}`,
    correo: null,
    activo: true,
    idAcudienteExterno: null,
    estudiante:
      rol === 'ESTUDIANTE'
        ? {
            idEstudianteExterno: BigInt(id * 1000),
            nivelId: 1n,
            estado: 'ACTIVO',
          }
        : null,
    creadoEn: CREADO_EN,
    ultimoAcceso: null,
    sincronizadoEn: null,
    ...extra,
  });
}

/**
 * Implementación en memoria de los puertos de usuarios y de CuentaRepository
 * (pruebas): el login, el guard y el CRUD ven los mismos datos.
 */
export class UsuariosEnMemoria
  implements
    UsuarioLecturaRepository,
    UsuarioEscrituraRepository,
    CuentaRepository
{
  private readonly usuarios = new Map<bigint, Usuario>();
  private siguienteId = 1000n;

  constructor(usuarios: Usuario[] = []) {
    for (const u of usuarios) this.usuarios.set(u.id, u);
  }

  todos(): Usuario[] {
    return [...this.usuarios.values()];
  }

  /** Reemplaza un usuario (lo usan otros dobles, ej.: cambio de nivel). */
  reemplazar(usuario: Usuario): void {
    this.usuarios.set(usuario.id, usuario);
  }

  async buscarPorId(id: bigint): Promise<Usuario | null> {
    return this.usuarios.get(id) ?? null;
  }

  async buscarPorIdUsuarioAuth(idUsuarioAuth: bigint): Promise<Cuenta | null> {
    const u = this.todos().find((x) => x.idUsuarioAuth === idUsuarioAuth);
    return u
      ? new Cuenta(
          u.id,
          u.idUsuarioAuth,
          u.rol,
          u.activo,
          u.estudiante?.estado ?? null,
        )
      : null;
  }

  async listar(
    filtro: FiltroUsuarios,
    paginacion: Paginacion,
  ): Promise<Pagina<Usuario>> {
    const filtrados = this.todos()
      .filter((u) => filtro.rol === null || u.rol === filtro.rol)
      .filter((u) => filtro.activo === null || u.activo === filtro.activo)
      .sort(
        (a, b) =>
          a.apellidos.localeCompare(b.apellidos) ||
          a.nombres.localeCompare(b.nombres) ||
          Number(a.id - b.id),
      );
    const inicio = saltar(paginacion);
    return {
      items: filtrados.slice(inicio, inicio + paginacion.limit),
      total: filtrados.length,
      ...paginacion,
    };
  }

  async camposEnUso(d: DatosNuevoUsuario): Promise<CampoUnico[]> {
    const enUso = new Set<CampoUnico>();
    for (const u of this.todos()) {
      if (u.idUsuarioAuth === d.idUsuarioAuth) enUso.add('idUsuarioAuth');
      if (d.correo && u.correo?.toLowerCase() === d.correo) enUso.add('correo');
      if (
        d.idAcudienteExterno !== null &&
        u.idAcudienteExterno === d.idAcudienteExterno
      ) {
        enUso.add('idAcudienteExterno');
      }
      if (
        d.idEstudianteExterno !== null &&
        u.estudiante?.idEstudianteExterno === d.idEstudianteExterno
      ) {
        enUso.add('idEstudianteExterno');
      }
    }
    return [...enUso];
  }

  async crear(
    d: DatosNuevoUsuario & { nivelId: bigint | null },
  ): Promise<Usuario> {
    const usuario = new Usuario({
      id: this.siguienteId++,
      idUsuarioAuth: d.idUsuarioAuth,
      rol: d.rol,
      nombres: d.nombres,
      apellidos: d.apellidos,
      correo: d.correo,
      activo: true,
      idAcudienteExterno: d.idAcudienteExterno,
      estudiante:
        d.rol === 'ESTUDIANTE' &&
        d.idEstudianteExterno !== null &&
        d.nivelId !== null
          ? {
              idEstudianteExterno: d.idEstudianteExterno,
              nivelId: d.nivelId,
              estado: 'ACTIVO',
            }
          : null,
      creadoEn: CREADO_EN,
      ultimoAcceso: null,
      sincronizadoEn: null,
    });
    this.usuarios.set(usuario.id, usuario);
    return usuario;
  }

  async cambiarActivo(
    id: bigint,
    activo: boolean,
  ): Promise<ResultadoCambioActivo> {
    const u = this.usuarios.get(id);
    if (!u) return { tipo: 'no_existe' };
    const directorasActivas = this.todos().filter(
      (x) => x.rol === 'DIRECTORA' && x.activo,
    );
    if (
      !activo &&
      u.rol === 'DIRECTORA' &&
      u.activo &&
      directorasActivas.length <= 1
    ) {
      return { tipo: 'ultima_directora' };
    }
    const actualizado = new Usuario({ ...u, activo });
    this.usuarios.set(id, actualizado);
    return { tipo: 'ok', usuario: actualizado };
  }

  async sincronizarCopia(
    id: bigint,
    copia: CopiaExterna,
    ahora: Date,
  ): Promise<void> {
    const u = this.usuarios.get(id);
    if (!u) throw new Error('No existe');
    this.usuarios.set(
      id,
      new Usuario({
        ...u,
        ...copia,
        ultimoAcceso: ahora,
        sincronizadoEn: ahora,
      }),
    );
  }
}

/** Niveles en memoria: BAJO=1, MEDIO=2, ALTO=3 (como el catálogo de la base). */
export class NivelesEnMemoria implements NivelConsulta {
  constructor(private readonly ids: bigint[] = [1n, 2n, 3n]) {}

  async existe(id: bigint): Promise<boolean> {
    return this.ids.includes(id);
  }

  async inicial(): Promise<bigint | null> {
    return this.ids[0] ?? null;
  }
}
