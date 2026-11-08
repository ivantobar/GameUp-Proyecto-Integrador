/**
 * Puerto de lectura: ¿qué estudiante de ASISCO UP corresponde a una cuenta
 * de la API de seguridad? Lo usa el alta automática del primer login para
 * llenar estudiante.id_estudiante_externo sin que nadie lo escriba a mano.
 */
export interface ConsultaEstudianteExterno {
  /**
   * idEstudiante de ASISCO UP de quien tiene ese id_usuario de seguridad, o
   * null si ASISCO UP no lo tiene (o respondió por otra persona: nunca se
   * acepta un id que no sea el pedido). Se consulta con el token de la propia
   * persona.
   *
   * Lanza ServicioExternoNoDisponibleError si ASISCO UP no responde, falla o
   * responde con un formato inesperado.
   */
  porIdUsuarioAuth(
    idUsuarioAuth: bigint,
    token: string,
  ): Promise<bigint | null>;
}

/** El valor es null cuando falta ASISCO_API_URL (integración apagada). */
export const CONSULTA_ESTUDIANTE_EXTERNO = Symbol(
  'CONSULTA_ESTUDIANTE_EXTERNO',
);
