import type { RolGameUp } from '../../../common/auth/usuario-autenticado.js';
import type {
  Pagina,
  Paginacion,
} from '../../../common/paginacion/paginacion.js';
import type { CopiaExterna } from './copia-externa.js';
import type { DatosNuevoUsuario } from './nuevo-usuario.js';
import type { Usuario } from './usuario.entity.js';

export interface FiltroUsuarios {
  rol: RolGameUp | null;
  activo: boolean | null;
}

/** Campos que no se pueden repetir entre cuentas. */
export type CampoUnico =
  'idUsuarioAuth' | 'correo' | 'idAcudienteExterno' | 'idEstudianteExterno';

/** Puerto de lectura (lo usan la directora y el login). */
export interface UsuarioLecturaRepository {
  buscarPorId(id: bigint): Promise<Usuario | null>;
  listar(
    filtro: FiltroUsuarios,
    paginacion: Paginacion,
  ): Promise<Pagina<Usuario>>;
  /** Cuáles de esos valores ya usa otra cuenta. */
  camposEnUso(datos: DatosNuevoUsuario): Promise<CampoUnico[]>;
}

/** Resultado de activar o desactivar una cuenta. */
export type ResultadoCambioActivo =
  | { tipo: 'ok'; usuario: Usuario }
  | { tipo: 'no_existe' }
  /** Era la única directora activa: no se desactivó. */
  | { tipo: 'ultima_directora' };

/** Puerto de escritura. */
export interface UsuarioEscrituraRepository {
  /** Crea `usuario` y, si es estudiante, `estudiante`, en una sola transacción. */
  crear(
    datos: DatosNuevoUsuario & { nivelId: bigint | null },
  ): Promise<Usuario>;
  /**
   * Activa o desactiva una cuenta. Al desactivar a una directora, la
   * implementación debe garantizar de forma ATÓMICA que quede otra directora
   * activa (dos peticiones simultáneas no pueden dejar a GameUP sin ninguna).
   */
  cambiarActivo(id: bigint, activo: boolean): Promise<ResultadoCambioActivo>;
  /** Refresca la copia mínima y marca ultimo_acceso y sincronizado_en. */
  sincronizarCopia(id: bigint, copia: CopiaExterna, ahora: Date): Promise<void>;
}

/** Puerto mínimo sobre los niveles (el catálogo completo llega en la fase 4). */
export interface NivelConsulta {
  existe(id: bigint): Promise<boolean>;
  /** El nivel de menor orden (BAJO), o null si no hay niveles. */
  inicial(): Promise<bigint | null>;
}

export const USUARIO_LECTURA_REPOSITORY = Symbol('USUARIO_LECTURA_REPOSITORY');
export const USUARIO_ESCRITURA_REPOSITORY = Symbol(
  'USUARIO_ESCRITURA_REPOSITORY',
);
export const NIVEL_CONSULTA = Symbol('NIVEL_CONSULTA');
