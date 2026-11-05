import type { RolGameUp } from '../../../common/auth/usuario-autenticado.js';

/**
 * Cuenta: lo mínimo que GameUP sabe de quien inicia sesión (tabla usuario).
 * Los datos personales oficiales viven en la API de seguridad.
 */
export class Cuenta {
  constructor(
    readonly id: bigint,
    readonly idUsuarioAuth: bigint,
    readonly rol: RolGameUp,
    readonly activo: boolean,
    /** estudiante.estado (ACTIVO, EGRESADO, RETIRADO) si el rol es ESTUDIANTE. */
    readonly estadoEstudiante: string | null = null,
  ) {}

  /**
   * Un estudiante egresado o retirado ya no inicia sesión (403). Su
   * historial sigue visible para la directora y su acudiente. Si por un
   * error de datos no tiene fila en `estudiante`, tampoco entra.
   */
  esEstudianteSinAcceso(): boolean {
    return this.rol === 'ESTUDIANTE' && this.estadoEstudiante !== 'ACTIVO';
  }

  /** ¿Alguno de los roles externos coincide con el rol de esta cuenta? */
  coincideCon(rolesExternos: readonly RolGameUp[]): boolean {
    return rolesExternos.includes(this.rol);
  }
}
