/**
 * Qué pasó con el resultado de un juego al terminar. Decide el mensaje de
 * la pantalla final (nunca un puntaje ni un error técnico para el niño):
 * - `review`: llegó al docente («Tu profe va a revisar…»);
 * - `practice`: juego libre, no se envía (decisión D1);
 * - `notSent`: debía enviarse y no se pudo ni reintentándolo (Regla 11):
 *   se celebra igual y hay un aviso para el adulto.
 */
export type Delivery = 'review' | 'practice' | 'notSent';

const DELIVERIES: readonly Delivery[] = ['review', 'practice', 'notSent'];

export function deliveryOf(result: { sentForReview: boolean }): Delivery {
  return result.sentForReview ? 'review' : 'practice';
}

/** Lee el tipo de envío de un parámetro de ruta. Por defecto, `review`. */
export function parseDelivery(value: unknown): Delivery {
  return typeof value === 'string' &&
    (DELIVERIES as readonly string[]).includes(value)
    ? (value as Delivery)
    : 'review';
}

/** Para el niño, cuando el juego llegó al docente. */
export const REVIEW_TEXT =
  'Tu profe va a revisar tu juego antes de sumarlo a tu progreso';

/** Para el niño, en juego libre o si no se pudo enviar. */
export const PRACTICE_TEXT = 'Sigue practicando cuando quieras';

/** Solo para el adulto que acompaña: qué hacer si no se pudo enviar. */
export const NOT_SENT_ADULT_TEXT =
  'Para el adulto: no pudimos enviar este juego a la profe. Revisen la conexión y vuelvan a abrirlo desde la tarea.';

/**
 * `actividadId` de la ruta: el juego se abrió desde una tarea y su
 * resultado va al docente. `null` = juego libre.
 */
export function parseActivityId(value: unknown): string | null {
  const id = Array.isArray(value) ? value[0] : value;
  return typeof id === 'string' && /^[\w-]{1,40}$/.test(id) ? id : null;
}
