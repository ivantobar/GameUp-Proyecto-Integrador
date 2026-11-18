import { StudentAccessError } from '@/data/studentErrors';

/** «Se borraron 3 grabaciones.» (con 1 y con 0, en palabras claras). */
export function recordingsDeletedText(count: number): string {
  if (count === 0) return 'No había grabaciones para borrar.';
  if (count === 1) return 'Se borró 1 grabación.';
  return `Se borraron ${count} grabaciones.`;
}

/** Por qué no se pudieron borrar. */
export function deleteRecordingsErrorText(error: unknown): string {
  if (error instanceof StudentAccessError) {
    return 'No puedes borrar las grabaciones de este estudiante.';
  }
  return 'No se pudieron borrar. Intenta de nuevo.';
}
