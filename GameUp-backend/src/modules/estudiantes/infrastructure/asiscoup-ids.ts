/** Utilidades para leer las respuestas de ASISCO UP (solo ids). */

export type Objeto = Record<string, unknown>;

export const esObjeto = (v: unknown): v is Objeto =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Un id positivo de ASISCO UP (llega como número o como texto). */
export function idAsisco(valor: unknown): bigint | null {
  if (typeof valor === 'number' && Number.isSafeInteger(valor) && valor > 0) {
    return BigInt(valor);
  }
  if (typeof valor === 'string' && /^[1-9]\d{0,18}$/.test(valor)) {
    return BigInt(valor);
  }
  return null;
}
