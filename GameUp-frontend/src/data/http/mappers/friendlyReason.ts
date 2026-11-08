/** Largo máximo de un motivo que se muestra tal cual en la pantalla. */
export const MAX_REASON_LENGTH = 200;

/**
 * Señales de un texto técnico que no se le muestra a nadie: códigos o ids
 * (3+ dígitos seguidos), símbolos de código o JSON, nombres_con_guion_bajo,
 * direcciones web, trazas y palabras de errores internos.
 */
const TECHNICAL =
  /\d{3,}|[{}<>[\]`\\|=_$#]|https?:|\bat\s+\S+\s*\(|error|exception|prisma|sql|stack|\b(null|undefined)\b/i;

/**
 * El `message` que mandó el backend, si es un texto razonable para la
 * persona (el backend los escribe en español claro). Si no viene, es muy
 * corto o largo, o parece técnico, devuelve `null` y la pantalla usa su
 * texto de siempre.
 */
export function friendlyReason(message: unknown): string | null {
  if (typeof message !== 'string') return null;
  const text = message.trim().replace(/\s+/g, ' ');
  if (text.length < 5 || text.length > MAX_REASON_LENGTH) return null;
  if (TECHNICAL.test(text)) return null;
  return text;
}
