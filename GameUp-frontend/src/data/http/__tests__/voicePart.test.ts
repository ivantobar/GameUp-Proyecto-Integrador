import { convertFormDataAsync } from 'expo/src/winter/fetch/convertFormData';
import { voicePart } from '../httpSubmissionRepositories';

const mockBytes = new Uint8Array([0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70]);
jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation(() => ({
    bytes: () => Promise.resolve(mockBytes),
  })),
}));

/** FormData mínimo con `entries()`, como el que parcha Expo. */
function formWith(parts: [string, unknown][]) {
  return { entries: () => parts } as unknown as FormData;
}

describe('voz en el multipart de expo/fetch (Expo SDK 58)', () => {
  it('la parte clásica { uri, name, type } falla: por eso no salía el audio', async () => {
    const form = formWith([
      ['audio', { uri: 'file:///voz.m4a', name: 'voz.m4a', type: 'audio/mp4' }],
    ]);
    await expect(convertFormDataAsync(form, 'x')).rejects.toThrow(
      'Unsupported FormDataPart implementation',
    );
  });

  it('voicePart se convierte con nombre, tipo y los bytes del archivo', async () => {
    const form = formWith([
      ['actividadId', '8'],
      ['audio', voicePart('file:///cache/voz.m4a')],
    ]);
    const { body } = await convertFormDataAsync(form, 'limite');
    const text = new TextDecoder('latin1').decode(body);

    expect(text).toContain('name="actividadId"\r\n\r\n8\r\n');
    expect(text).toContain(
      'content-disposition: form-data; name="audio"; filename="voz.m4a"',
    );
    expect(text).toContain('content-type: audio/mp4');
    expect(text).toContain('ftyp');
  });
});
