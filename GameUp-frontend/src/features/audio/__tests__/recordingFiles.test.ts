import { createRecording, mockFiles } from '@/test-utils/mockFiles';
import {
  deleteAllRecordings,
  deleteRecording,
  isAppRecording,
  newRecordingName,
  RECORDING_PREFIX,
} from '../recordingFiles';

afterEach(() => {
  mockFiles().clear();
});

describe('nombres de las grabaciones de GameUP', () => {
  it('llevan el prefijo de la app y no se repiten', () => {
    const first = newRecordingName();
    const second = newRecordingName();

    expect(first.startsWith(RECORDING_PREFIX)).toBe(true);
    expect(isAppRecording(first)).toBe(true);
    expect(first).not.toBe(second);
  });

  it('un archivo sin el prefijo no es de la app', () => {
    expect(isAppRecording('recording-1234.m4a')).toBe(false);
    expect(isAppRecording('foto.jpg')).toBe(false);
  });
});

describe('deleteRecording', () => {
  it('borra una grabación de la app', () => {
    const uri = createRecording();

    deleteRecording(uri);

    expect(mockFiles().has(uri)).toBe(false);
  });

  it('no toca archivos que no son de la app', () => {
    const other = 'file:///cache/Audio/recording-ajena.m4a';
    mockFiles().add(other);

    deleteRecording(other);

    expect(mockFiles().has(other)).toBe(true);
  });

  it('sin ruta o si ya no existe, no hace nada ni lanza', () => {
    expect(() => deleteRecording(null)).not.toThrow();
    expect(() => deleteRecording(undefined)).not.toThrow();
    expect(() =>
      deleteRecording('file:///cache/Audio/gameup-grabacion-ya-no.m4a'),
    ).not.toThrow();
  });
});

describe('deleteAllRecordings (al abrir la app y al cerrar sesión)', () => {
  it('borra solo las grabaciones de GameUP, en Android y en iPhone', () => {
    const android = createRecording('gameup-grabacion-a');
    const iphone = 'file:///cache/ExpoAudio/gameup-grabacion-b.m4a';
    const otherAudio = 'file:///cache/Audio/recording-otra-app.m4a';
    const otherCache = 'file:///cache/imagen.png';
    const files = mockFiles();
    files.add(iphone);
    files.add(otherAudio);
    files.add(otherCache);

    const deleted = deleteAllRecordings();

    expect(deleted).toBe(2);
    expect(files.has(android)).toBe(false);
    expect(files.has(iphone)).toBe(false);
    // El resto de la caché queda igual.
    expect(files.has(otherAudio)).toBe(true);
    expect(files.has(otherCache)).toBe(true);
  });

  it('sin carpetas de audio no hace nada', () => {
    expect(deleteAllRecordings()).toBe(0);
  });
});
