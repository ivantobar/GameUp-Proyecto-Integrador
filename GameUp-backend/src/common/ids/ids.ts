import { Matches } from 'class-validator';

/**
 * Los ids de la base son `bigint`. En JSON viajan como string (JSON no
 * serializa bigint y la app usa ids string). Estas utilidades validan y
 * convierten en un solo lugar.
 */

/** Mayor valor de un `bigint` de PostgreSQL. */
const BIGINT_MAX = 9223372036854775807n;

/** Entero positivo sin ceros a la izquierda, de hasta 19 dígitos. */
const PATRON_ID = /^[1-9]\d{0,18}$/;

export function esIdValido(valor: unknown): valor is string {
  return (
    typeof valor === 'string' &&
    PATRON_ID.test(valor) &&
    BigInt(valor) <= BIGINT_MAX
  );
}

/** Convierte un id ya validado. Lanza si no es válido (error de programación). */
export function aBigInt(valor: string): bigint {
  if (!esIdValido(valor)) {
    throw new TypeError('Id inválido');
  }
  return BigInt(valor);
}

/** Para los DTO de salida. */
export function idATexto(id: bigint): string {
  return id.toString();
}

/**
 * Decorador para DTO de entrada: el campo es un id numérico en texto
 * (ej.: "42"). Después, el mapper lo convierte con `aBigInt`.
 */
export function IsIdNumerico(
  opciones: { each?: boolean } = {},
): PropertyDecorator {
  return Matches(PATRON_ID, {
    each: opciones.each ?? false,
    message: ({ property }) =>
      opciones.each
        ? `${property} debe ser una lista de ids numéricos en texto (ej.: ["42"])`
        : `${property} debe ser un id numérico en texto (ej.: "42")`,
  });
}
