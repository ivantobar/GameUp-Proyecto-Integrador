import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type SetHold = (id: string, active: boolean) => void;

const RefreshHoldContext = createContext<SetHold | null>(null);

/**
 * Pausas de la recarga automática de una pantalla. Los componentes de
 * adentro avisan «estoy ocupado» con `useHoldAutoRefresh` (suena un audio,
 * hay una indicación escrita o una nota de voz sin enviar) y la pantalla
 * pasa `paused` a `useScreenRefresh`. Deslizar o «Actualizar» no se pausan.
 */
export function useRefreshHolds(): {
  paused: boolean;
  Provider: (props: { children: ReactNode }) => ReactNode;
} {
  const [holds, setHolds] = useState<ReadonlySet<string>>(new Set());
  const setHold = useCallback<SetHold>((id, active) => {
    setHolds((current) => {
      if (current.has(id) === active) return current;
      const next = new Set(current);
      if (active) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  const Provider = useMemo(
    () =>
      function RefreshHoldProvider({ children }: { children: ReactNode }) {
        return (
          <RefreshHoldContext.Provider value={setHold}>
            {children}
          </RefreshHoldContext.Provider>
        );
      },
    [setHold],
  );
  return { paused: holds.size > 0, Provider };
}

/**
 * Mientras `active` sea verdadero, la pantalla no se recarga sola. Fuera de
 * una pantalla con pausas, no hace nada.
 */
export function useHoldAutoRefresh(active: boolean) {
  const setHold = useContext(RefreshHoldContext);
  const id = useId();
  useEffect(() => {
    if (!setHold) return undefined;
    setHold(id, active);
    return () => setHold(id, false);
  }, [setHold, id, active]);
}
