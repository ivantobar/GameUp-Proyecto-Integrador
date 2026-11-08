/**
 * Vínculos acudiente ⇄ estudiante de ASISCO UP (fuente oficial).
 *
 * GameUP conserva la tabla acudiente_estudiante como COPIA: la usan los
 * permisos del acudiente, los avisos (fn_notificar_acudientes) y la regla de
 * práctica en casa. Cuando ASISCO_API_URL está configurada, esa copia se
 * refresca desde ASISCO UP cada vez que el acudiente inicia sesión, y la
 * directora ya no la edita a mano.
 */
export interface VinculoExterno {
  /** idEstudiante en ASISCO UP (= estudiante.id_estudiante_externo). */
  idEstudianteExterno: bigint;
  parentesco: string;
  esPrincipal: boolean;
}

export interface VinculosDeAcudiente {
  /** id_usuario de la API de seguridad que ASISCO UP asoció al acudiente. */
  idUsuarioAuth: bigint;
  estudiantes: VinculoExterno[];
}

/** Puerto de lectura: GET /api/acudientes/me/estudiantes con el token del acudiente. */
export interface ConsultaVinculos {
  /** Lanza ServicioExternoNoDisponibleError si no se puede consultar. */
  deAcudiente(token: string): Promise<VinculosDeAcudiente>;
}

/** Vínculo ya traducido a ids de GameUP, listo para guardar en la copia. */
export interface VinculoLocal {
  estudianteId: bigint;
  parentesco: string;
  esPrincipal: boolean;
}

export interface CopiaVinculosRepository {
  /** Mapa idEstudianteExterno → estudiante.usuario_id (solo los que existen en GameUP). */
  estudiantesPorExterno(externos: bigint[]): Promise<Map<bigint, bigint>>;
  /** Deja la copia del acudiente exactamente igual a `vinculos` (en una transacción). */
  reemplazarDeAcudiente(
    acudienteId: bigint,
    vinculos: VinculoLocal[],
  ): Promise<void>;
}

/** Lo que usa el login para refrescar la copia (no depende de HTTP). */
export interface SincronizadorVinculos {
  sincronizarAcudiente(
    acudiente: { id: bigint; idUsuarioAuth: bigint },
    token: string,
  ): Promise<void>;
}

export const COPIA_VINCULOS_REPOSITORY = Symbol('COPIA_VINCULOS_REPOSITORY');
export const SINCRONIZADOR_VINCULOS = Symbol('SINCRONIZADOR_VINCULOS');
/** true cuando ASISCO_API_URL está configurada: los vínculos son de ASISCO UP. */
export const VINCULOS_EN_ASISCO = Symbol('VINCULOS_EN_ASISCO');
