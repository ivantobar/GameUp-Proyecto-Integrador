import { act, renderHook } from '@testing-library/react-native';
import { useAudioRecorder } from 'expo-audio';
import { createRecording, mockFiles } from '@/test-utils/mockFiles';
import { useVoiceNote } from '../useVoiceNote';

/** La grabadora simulada de `__mocks__/expo-audio.ts` (la misma siempre). */
const recorder = (
  useAudioRecorder as unknown as () => {
    uri: string | null;
    prepareToRecordAsync: jest.Mock;
  }
)();

/** Graba una nota y la detiene: queda lista para enviar. */
async function recordNote() {
  const uri = createRecording('gameup-grabacion-nota');
  recorder.prepareToRecordAsync.mockImplementationOnce(() => {
    recorder.uri = uri;
    return Promise.resolve();
  });
  const view = await renderHook(() => useVoiceNote());
  await act(async () => {
    await view.result.current.start();
  });
  await act(async () => {
    await view.result.current.stop();
  });
  expect(view.result.current.phase).toBe('recorded');
  return { ...view, uri };
}

afterEach(() => {
  mockFiles().clear();
  recorder.uri = null;
});

describe('nota de voz de la docente', () => {
  it('se borra del teléfono justo después de guardarla', async () => {
    const { result, uri } = await recordNote();
    const onSave = jest.fn(() => Promise.resolve(true));

    let saved = false;
    await act(async () => {
      saved = await result.current.save(onSave);
    });

    expect(onSave).toHaveBeenCalledWith(uri);
    expect(saved).toBe(true);
    expect(mockFiles().has(uri)).toBe(false);
    expect(result.current.uri).toBeNull();
  });

  it('si no se pudo guardar, se conserva para intentarlo otra vez', async () => {
    const { result, uri } = await recordNote();

    await act(async () => {
      await result.current.save(() => Promise.resolve(false));
    });

    expect(mockFiles().has(uri)).toBe(true);
    expect(result.current.phase).toBe('recorded');
    expect(result.current.uri).toBe(uri);
  });
});
