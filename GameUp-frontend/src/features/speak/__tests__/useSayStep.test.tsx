import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { useAudioRecorder } from 'expo-audio';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import type { Repositories } from '@/data/repositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import { createRecording, mockFiles } from '@/test-utils/mockFiles';
import { useSayStep } from '../useSayStep';

/** La grabadora simulada de `__mocks__/expo-audio.ts` (la misma siempre). */
const recorder = (
  useAudioRecorder as unknown as () => {
    uri: string | null;
    isRecording: boolean;
    prepareToRecordAsync: jest.Mock;
  }
)();

function wrapperWith(repositories: Repositories) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <RepositoryProvider repositories={repositories}>
        {children}
      </RepositoryProvider>
    );
  };
}

async function renderSayStep(activityId: string | null, consent = true) {
  const repositories = createMockRepositories({
    delayMs: 0,
    voiceConsent: () => consent,
  });
  const onDone = jest.fn();
  const view = await renderHook(() => useSayStep('a', onDone, activityId), {
    wrapper: wrapperWith(repositories),
  });
  // Espera la consulta del consentimiento.
  await act(async () => {
    await jest.runAllTimersAsync();
  });
  return { ...view, onDone, repositories };
}

afterEach(() => {
  mockFiles().clear();
  recorder.uri = null;
  recorder.isRecording = false;
  recorder.prepareToRecordAsync.mockClear();
});

describe('«Dilo»: cuándo se graba la voz', () => {
  it('en práctica libre no se graba, aunque haya autorización', async () => {
    const { result } = await renderSayStep(null, true);

    expect(result.current.canRecord).toBe(false);
  });

  it('desde una tarea y con autorización, sí se graba', async () => {
    const { result } = await renderSayStep('act-demo-002', true);

    expect(result.current.canRecord).toBe(true);
  });

  it('desde una tarea sin autorización, no se graba', async () => {
    const { result } = await renderSayStep('act-demo-002', false);

    expect(result.current.canRecord).toBe(false);
  });

  it('cada grabación tiene un nombre de GameUP', async () => {
    const { result } = await renderSayStep('act-demo-002', true);

    await act(async () => {
      await result.current.toggleRecording();
    });

    expect(recorder.prepareToRecordAsync).toHaveBeenCalledWith({
      fileName: expect.stringMatching(/^gameup-grabacion-/),
    });
  });
});

describe('«Dilo»: la voz no queda en el teléfono si se sale sin terminar', () => {
  it('al salir mientras graba, la grabación se borra', async () => {
    const uri = createRecording();
    recorder.prepareToRecordAsync.mockImplementationOnce(() => {
      recorder.uri = uri;
      return Promise.resolve();
    });
    const { result, unmount } = await renderSayStep('act-demo-002', true);

    await act(async () => {
      await result.current.toggleRecording();
    });
    await unmount();

    expect(mockFiles().has(uri)).toBe(false);
  });

  it('al terminar, la grabación pasa a «Listo» y «Dilo» no la borra', async () => {
    const uri = createRecording();
    recorder.prepareToRecordAsync.mockImplementationOnce(() => {
      recorder.uri = uri;
      return Promise.resolve();
    });
    const { result, unmount, onDone } = await renderSayStep(
      'act-demo-002',
      true,
    );

    await act(async () => {
      await result.current.toggleRecording();
    });
    await act(async () => {
      const done = result.current.finish();
      await jest.runAllTimersAsync();
      await done;
    });
    await unmount();

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone.mock.calls[0][0].attempt.audioUri).toBe(uri);
    expect(mockFiles().has(uri)).toBe(true);
  });
});

describe('«Dilo»: tope de 10 s de grabación', () => {
  /**
   * En el teléfono, el medidor de volumen vuelve a dibujar «Dilo» cada
   * 100 ms mientras graba. Aquí se imita: avanza el reloj de a 100 ms y
   * vuelve a dibujar en cada paso.
   */
  async function recordFor(ms: number, rerender: (props: unknown) => unknown) {
    for (let elapsed = 0; elapsed < ms; elapsed += 100) {
      await act(async () => {
        await jest.advanceTimersByTimeAsync(100);
      });
      await rerender(undefined);
    }
  }

  it('a los 10 s para sola, pasa a «Listo» y envía una sola vez', async () => {
    const { result, rerender, onDone, repositories } = await renderSayStep(
      'act-demo-002',
      true,
    );
    const submit = jest.spyOn(repositories.recordings, 'submitSpeechAttempt');

    await act(async () => {
      await result.current.toggleRecording();
    });
    await recordFor(9_900, rerender);
    // Todavía no: falta 0,1 s.
    expect(onDone).not.toHaveBeenCalled();

    await recordFor(200, rerender);
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('si el niño toca «terminar» justo cuando llega el tope, se envía una sola vez', async () => {
    const { result, rerender, onDone, repositories } = await renderSayStep(
      'act-demo-002',
      true,
    );
    const submit = jest.spyOn(repositories.recordings, 'submitSpeechAttempt');

    await act(async () => {
      await result.current.toggleRecording();
    });
    await recordFor(9_900, rerender);
    // El tope y el toque llegan a la vez.
    await act(async () => {
      const tap = result.current.toggleRecording();
      await jest.advanceTimersByTimeAsync(100);
      await tap;
      await jest.runOnlyPendingTimersAsync();
    });
    // Y otro toque tarde, ya en camino a «Listo».
    await act(async () => {
      await result.current.finish();
    });

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledTimes(1);
  });
});
