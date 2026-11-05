/**
 * Códigos que usa el backend para los juegos y los estados
 * (`GameUp-backend/src/modules/catalogo/domain/juegos/estrategia-juego.ts`
 * y `asignaciones/domain/asignacion.entity.ts`).
 */
export type CodigoJuego =
  | 'EMPAREJAR'
  | 'CLASIFICAR'
  | 'SECUENCIAR'
  | 'MEMORIA'
  | 'HABLA_CONMIGO'
  | 'BUSCA_LA_BOCA';

/** Estado de una actividad dentro de una asignación. */
export type EstadoActividad =
  'SIN_INTENTOS' | 'PENDIENTE_VALIDACION' | 'RECHAZADA' | 'APROBADA';

/** Estado de un intento. */
export type EstadoIntento = 'PENDIENTE_VALIDACION' | 'APROBADO' | 'RECHAZADO';
