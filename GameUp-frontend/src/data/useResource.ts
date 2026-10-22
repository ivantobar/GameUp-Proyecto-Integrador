import { useCallback, useEffect, useState } from 'react';

export type Resource<T> =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: T };

/**
 * Carga datos asíncronos y expone carga, error y listo, más `reload` para
 * reintentar. `load` debe estar memorizada con `useCallback`.
 */
export function useResource<T>(load: () => Promise<T>) {
  const [resource, setResource] = useState<Resource<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    load()
      .then((data) => {
        if (active) setResource({ status: 'ready', data });
      })
      .catch((error: unknown) => {
        console.warn('[GameUP] No se pudieron cargar los datos', error);
        if (active) setResource({ status: 'error' });
      });
    return () => {
      active = false;
    };
  }, [load, attempt]);

  /** Reintenta mostrando «cargando» (después de un error). */
  const reload = useCallback(() => {
    setResource({ status: 'loading' });
    setAttempt((value) => value + 1);
  }, []);

  /** Vuelve a pedir los datos sin ocultar los que ya se ven. */
  const refresh = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  return { resource, reload, refresh };
}
