import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { useIsFocused } from 'expo-router';
import { useScreenRefresh, type Refreshable } from '../useScreenRefresh';

jest.mock('expo-router', () => ({
  useIsFocused: jest.fn(() => true),
  // La recarga al volver a la pantalla se prueba en useRefreshOnFocus.
  useFocusEffect: jest.fn(),
}));

/** Captura el oyente de AppState para simular que la app va y vuelve. */
let appStateListener: ((state: AppStateStatus) => void) | null = null;
beforeEach(() => {
  appStateListener = null;
  jest.mocked(useIsFocused).mockReturnValue(true);
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_, listener) => {
    appStateListener = listener as (state: AppStateStatus) => void;
    return {
      remove: () => {
        appStateListener = null;
      },
    } as ReturnType<typeof AppState.addEventListener>;
  });
});

function source(overrides: Partial<Refreshable> = {}): Refreshable {
  return {
    refresh: jest.fn(() => Promise.resolve()),
    refreshing: false,
    refreshFailed: false,
    ...overrides,
  };
}

async function appGoesAwayAndBack() {
  await act(async () => {
    appStateListener?.('background');
    appStateListener?.('active');
  });
}

describe('useScreenRefresh', () => {
  it('al volver la app al frente, recarga la pantalla visible', async () => {
    const src = source();
    await renderHook(() => useScreenRefresh(src));
    await appGoesAwayAndBack();
    expect(src.refresh).toHaveBeenCalledTimes(1);
  });

  it('una pantalla que no es la visible no escucha a la app', async () => {
    jest.mocked(useIsFocused).mockReturnValue(false);
    const src = source();
    await renderHook(() => useScreenRefresh(src));
    expect(appStateListener).toBeNull();
    await appGoesAwayAndBack();
    expect(src.refresh).not.toHaveBeenCalled();
  });

  it('no hay recarga periódica: con el tiempo, nada se recarga solo', async () => {
    const src = source();
    await renderHook(() => useScreenRefresh(src));
    await act(async () => {
      jest.advanceTimersByTime(10 * 60 * 1000);
    });
    expect(src.refresh).not.toHaveBeenCalled();
    // Ni después de otros diez minutos (no hay un intervalo escondido).
    await act(async () => {
      jest.advanceTimersByTime(10 * 60 * 1000);
    });
    expect(src.refresh).not.toHaveBeenCalled();
  });

  it('en pausa, la recarga automática espera; al terminar la pausa se hace', async () => {
    const src = source();
    const { rerender } = await renderHook(
      ({ paused }: { paused: boolean }) =>
        useScreenRefresh(src, { autoPaused: paused }),
      { initialProps: { paused: true } },
    );
    await appGoesAwayAndBack();
    expect(src.refresh).not.toHaveBeenCalled();

    await rerender({ paused: false });
    expect(src.refresh).toHaveBeenCalledTimes(1);
  });

  it('en pausa, deslizar o «Actualizar» sí recargan', async () => {
    const src = source();
    const { result } = await renderHook(() =>
      useScreenRefresh(src, { autoPaused: true }),
    );
    await act(async () => {
      result.current.onRefresh();
    });
    expect(src.refresh).toHaveBeenCalledTimes(1);
  });

  it('al deslizar, la ruedita se ve hasta que termina la recarga', async () => {
    let finish: () => void = () => {};
    const src = source({
      refresh: jest.fn(
        () =>
          new Promise<void>((resolve) => {
            finish = resolve;
          }),
      ),
    });
    const { result } = await renderHook(() => useScreenRefresh(src));
    await act(async () => {
      result.current.onRefresh();
    });
    expect(result.current.pulling).toBe(true);
    await act(async () => finish());
    expect(result.current.pulling).toBe(false);
  });

  it('pasa la falla de la recarga a la pantalla', async () => {
    const { result } = await renderHook(() =>
      useScreenRefresh(source({ refreshFailed: true })),
    );
    expect(result.current.failed).toBe(true);
  });
});
