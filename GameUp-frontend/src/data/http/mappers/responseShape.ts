import { ServerError } from '@/services/apiErrors';

/**
 * Comprobaciones mínimas de la forma de una respuesta. Si el backend cambia
 * un campo, la app falla con un error claro en vez de mostrar datos a medias.
 */
export function unexpected(field: string): ServerError {
  return new ServerError(`Respuesta inesperada del servidor: ${field}`, null);
}

export function requireText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) throw unexpected(field);
  return value;
}

/** Entero mayor o igual a 0. */
export function requireCount(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw unexpected(field);
  }
  return value;
}

export function requireList(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) throw unexpected(field);
  return value;
}
