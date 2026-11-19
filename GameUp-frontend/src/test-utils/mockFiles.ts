import * as FileSystem from 'expo-file-system';

/**
 * Archivos en memoria de la simulación de expo-file-system
 * (`__mocks__/expo-file-system.ts`): para crear grabaciones en las pruebas y
 * comprobar cuáles se borraron. Se lee del mismo módulo que importa la app
 * (`jest.requireMock` daría otra instancia).
 */
export function mockFiles(): Set<string> {
  return (FileSystem as unknown as { __mockFiles: Set<string> }).__mockFiles;
}

/** Ruta de una grabación de GameUP en la caché simulada (Android). */
export function recordingUri(name = 'gameup-grabacion-prueba'): string {
  return `file:///cache/Audio/${name}.m4a`;
}

/** Crea una grabación de GameUP en la caché simulada y devuelve su ruta. */
export function createRecording(name?: string): string {
  const uri = recordingUri(name);
  mockFiles().add(uri);
  return uri;
}
