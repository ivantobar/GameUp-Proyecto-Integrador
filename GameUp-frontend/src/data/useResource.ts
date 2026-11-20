import { useCallback, useEffect, useRef, useState } from 'react';

export type Resource<T> =
  | { status: 'loading' }
  /** `error`: lo que falló, para elegir el mensaje (por ejemplo, sin permiso). */
  | { status: 'error'; error?: unknown }
  | { status: 'ready'; data: T };

/**
 * Carga datos asíncronos y expone carga, error y listo, más `reload` para
 * reintentar y `refresh` para actualizar sin ocultar lo que se ve. `load`
 * debe estar memorizada con `useCallback`.
 *
 * Recargar (`refresh`):
 * - una sola petición a la vez: si ya hay una en curso, espera a esa;
 * - mientras recarga, se siguen viendo los datos (`refreshing`);
 * - si falla y ya había datos, los datos se quedan y se marca
 *   `refreshFailed` (la pantalla muestra un aviso suave con reintentar).
 */
export function useResource<T>(load: () => Promise<T>) {
  const [resource, setResource] = useState<Resource<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  /** Hay una petición en curso (la inicial, un reintento o una recarga). */
  const inFlight = useRef(false);
  /** La petición en curso es una recarga (conserva los datos si falla). */
  const isRefresh = useRef(false);
  /** Quienes esperan a que termine la petición en curso. */
  const waiters = useRef<(() => void)[]>([]);

  useEffect(() => {
    let active = true;
    inFlight.current = true;
    load()
      .then((data) => {
        if (!active) return;
        setResource({ status: 'ready', data });
        setRefreshFailed(false);
      })
      .catch((error: unknown) => {
        // Solo en desarrollo y solo el tipo de error: el mensaje del
        // servidor puede traer datos de un niño y el registro del teléfono
        // (logcat) lo podría leer otra app.
        if (__DEV__) {
          console.warn(
            '[GameUP] No se pudieron cargar los datos',
            error instanceof Error ? error.name : 'Error',
          );
        }
        if (!active) return;
        const keepData = isRefresh.current;
        setResource((current) =>
          keepData && current.status === 'ready'
            ? current
            : { status: 'error', error },
        );
        if (keepData) setRefreshFailed(true);
      })
      .finally(() => {
        if (!active) return;
        inFlight.current = false;
        isRefresh.current = false;
        setRefreshing(false);
        const done = waiters.current;
        waiters.current = [];
        done.forEach((resolve) => resolve());
      });
    return () => {
      active = false;
    };
  }, [load, attempt]);

  /** Reintenta mostrando «cargando» (después de un error). */
  const reload = useCallback(() => {
    isRefresh.current = false;
    inFlight.current = true;
    setRefreshFailed(false);
    setResource({ status: 'loading' });
    setAttempt((value) => value + 1);
  }, []);

  /**
   * Vuelve a pedir los datos sin ocultar los que ya se ven. Si ya hay una
   * petición en curso no lanza otra: espera a esa. Termina cuando llega la
   * respuesta (o falla).
   */
  const refresh = useCallback((): Promise<void> => {
    const finished = new Promise<void>((resolve) => {
      waiters.current.push(resolve);
    });
    if (inFlight.current) return finished;
    inFlight.current = true;
    isRefresh.current = true;
    setRefreshing(true);
    setAttempt((value) => value + 1);
    return finished;
  }, []);

  return { resource, reload, refresh, refreshing, refreshFailed };
}
