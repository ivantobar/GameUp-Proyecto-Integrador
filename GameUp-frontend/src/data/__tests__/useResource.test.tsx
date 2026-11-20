import { act, renderHook } from '@testing-library/react-native';
import { useResource } from '../useResource';

/** Una carga controlada a mano: cada llamada queda pendiente hasta resolverla. */
function controlledLoad() {
  const calls: {
    resolve: (value: string) => void;
    reject: (error: unknown) => void;
  }[] = [];
  const load = jest.fn(
    () =>
      new Promise<string>((resolve, reject) => {
        calls.push({ resolve, reject });
      }),
  );
  return { load, calls };
}

async function settle() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('useResource: recargar', () => {
  it('varias recargas seguidas hacen UNA sola petición', async () => {
    const { load, calls } = controlledLoad();
    const { result } = await renderHook(() => useResource(load));
    await act(async () => calls[0]!.resolve('uno'));
    expect(load).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.refresh();
      result.current.refresh();
      result.current.refresh();
    });
    expect(load).toHaveBeenCalledTimes(2);
    expect(result.current.refreshing).toBe(true);

    await act(async () => calls[1]!.resolve('dos'));
    await settle();
    expect(result.current.refreshing).toBe(false);
    expect(result.current.resource).toEqual({ status: 'ready', data: 'dos' });
  });

  it('mientras recarga, sigue mostrando los datos', async () => {
    const { load, calls } = controlledLoad();
    const { result } = await renderHook(() => useResource(load));
    await act(async () => calls[0]!.resolve('uno'));

    await act(async () => {
      result.current.refresh();
    });
    expect(result.current.resource).toEqual({ status: 'ready', data: 'uno' });
  });

  it('si la recarga falla, los datos se quedan y se marca la falla', async () => {
    const { load, calls } = controlledLoad();
    const { result } = await renderHook(() => useResource(load));
    await act(async () => calls[0]!.resolve('uno'));

    await act(async () => {
      result.current.refresh();
    });
    await act(async () => calls[1]!.reject(new Error('sin red')));
    await settle();
    expect(result.current.resource).toEqual({ status: 'ready', data: 'uno' });
    expect(result.current.refreshFailed).toBe(true);

    // Al reintentar y salir bien, se quita la marca.
    await act(async () => {
      result.current.refresh();
    });
    await act(async () => calls[2]!.resolve('tres'));
    await settle();
    expect(result.current.refreshFailed).toBe(false);
    expect(result.current.resource).toEqual({ status: 'ready', data: 'tres' });
  });

  it('la primera carga que falla sigue mostrando el error (como antes)', async () => {
    const { load, calls } = controlledLoad();
    const { result } = await renderHook(() => useResource(load));
    await act(async () => calls[0]!.reject(new Error('sin red')));
    await settle();
    expect(result.current.resource.status).toBe('error');
    expect(result.current.refreshFailed).toBe(false);
  });

  it('reload vuelve a mostrar «cargando» y reintenta', async () => {
    const { load, calls } = controlledLoad();
    const { result } = await renderHook(() => useResource(load));
    await act(async () => calls[0]!.reject(new Error('sin red')));
    await settle();

    await act(async () => {
      result.current.reload();
    });
    expect(result.current.resource).toEqual({ status: 'loading' });
    await act(async () => calls[1]!.resolve('uno'));
    await settle();
    expect(result.current.resource).toEqual({ status: 'ready', data: 'uno' });
  });

  it('una recarga durante la carga inicial espera a esa (sin otra petición)', async () => {
    const { load, calls } = controlledLoad();
    const { result } = await renderHook(() => useResource(load));
    let done = false;
    await act(async () => {
      result.current.refresh().then(() => {
        done = true;
      });
    });
    expect(load).toHaveBeenCalledTimes(1);
    await act(async () => calls[0]!.resolve('uno'));
    await settle();
    expect(done).toBe(true);
  });
});
