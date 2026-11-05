import {
  ConnectionError,
  ServerError,
  UnauthorizedError,
} from '@/services/apiErrors';
import { withSilentRetry } from '../silentRetry';

/** Espera la promesa avanzando el reloj simulado (las pausas entre intentos). */
async function settle<T>(promise: Promise<T>) {
  const outcome = promise.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  );
  await jest.runAllTimersAsync();
  return outcome;
}

describe('reintento silencioso (Regla 11)', () => {
  it('sin red: reintenta y entrega el resultado sin que se note', async () => {
    const send = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(new ConnectionError())
      .mockRejectedValueOnce(new ServerError('caído', 503))
      .mockResolvedValue('guardado');

    const result = await settle(withSilentRetry(send));

    expect(result).toEqual({ ok: true, value: 'guardado' });
    expect(send).toHaveBeenCalledTimes(3);
  });

  it('después de 3 intentos se rinde y deja subir el error', async () => {
    const send = jest
      .fn<Promise<string>, []>()
      .mockRejectedValue(new ConnectionError());

    const result = await settle(withSilentRetry(send));

    expect(result.ok).toBe(false);
    expect(send).toHaveBeenCalledTimes(3);
  });

  it.each([
    ['422 (datos)', new ServerError('total no coincide', 422)],
    ['401 (sesión)', new UnauthorizedError()],
  ])('un %s no se repite: no mejoraría', async (_name, error) => {
    const send = jest.fn<Promise<string>, []>().mockRejectedValue(error);

    const result = await settle(withSilentRetry(send));

    expect(result).toEqual({ ok: false, error });
    expect(send).toHaveBeenCalledTimes(1);
  });
});
