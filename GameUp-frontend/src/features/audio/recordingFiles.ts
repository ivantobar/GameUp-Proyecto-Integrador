import { Directory, File, Paths } from 'expo-file-system';

/**
 * Archivos de voz que graba GameUP (Ley 1581: datos de menores).
 *
 * Cada grabación lleva un nombre con este prefijo para poder borrar SOLO las
 * de la app, sin tocar el resto de la caché. expo-audio las guarda en la
 * caché, en `Audio/` (Android) o `ExpoAudio/` (iPhone).
 */
export const RECORDING_PREFIX = 'gameup-grabacion-';

/** Carpetas de la caché donde expo-audio deja las grabaciones. */
const RECORDING_FOLDERS = ['Audio', 'ExpoAudio'] as const;

/** Nombre nuevo para una grabación (sin extensión: la pone expo-audio). */
export function newRecordingName(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${RECORDING_PREFIX}${Date.now()}-${random}`;
}

/** Si el archivo es una grabación de GameUP (por su nombre). */
export function isAppRecording(name: string): boolean {
  return name.startsWith(RECORDING_PREFIX);
}

/**
 * Borra una grabación de GameUP. No hace nada si no hay ruta, si ya no
 * existe o si el archivo no es de la app. Nunca lanza: borrar no debe
 * interrumpir al niño.
 */
export function deleteRecording(uri: string | null | undefined): void {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (!isAppRecording(file.name) || !file.exists) return;
    file.delete();
  } catch {
    // Si no se pudo, se borra al abrir la app o al cerrar sesión.
  }
}

/**
 * Borra todas las grabaciones de GameUP que hayan quedado en el teléfono
 * (al abrir la app y al cerrar sesión). Solo toca los archivos con el
 * prefijo de la app. Devuelve cuántos borró.
 */
export function deleteAllRecordings(): number {
  let deleted = 0;
  for (const folder of RECORDING_FOLDERS) {
    try {
      const directory = new Directory(Paths.cache, folder);
      if (!directory.exists) continue;
      for (const entry of directory.list()) {
        if (entry instanceof File && isAppRecording(entry.name)) {
          try {
            entry.delete();
            deleted += 1;
          } catch {
            // Se intenta otra vez la próxima vez.
          }
        }
      }
    } catch {
      // Sin acceso a la carpeta: no hay nada que hacer ahora.
    }
  }
  return deleted;
}
