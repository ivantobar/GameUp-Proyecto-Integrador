import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useIsFocused } from 'expo-router';
import type { ScreenRefresh } from '@/components/ui';
import { useRefreshOnFocus } from '@/data/useRefreshOnFocus';

/** Lo que una pantalla sabe recargar (lo dan `useResource` y sus hooks). */
export interface Refreshable {
  /** Vuelve a pedir los datos sin ocultar los que se ven. */
  refresh: () => Promise<void> | void;
  /** Hay una recarga en curso. */
  refreshing: boolean;
  /** Falló la última recarga (los datos de antes siguen visibles). */
  refreshFailed: boolean;
}

interface Options {
  /**
   * Pausa la recarga AUTOMÁTICA (al volver a la pantalla o a la app), por
   * ejemplo mientras suena un audio o hay una nota sin enviar. La recarga
   * pendiente se hace cuando termina la pausa. Deslizar o «Actualizar»
   * siempre recargan.
   */
  autoPaused?: boolean;
}

/**
 * Recarga de una pantalla, en un solo lugar:
 * - deslizar hacia abajo y el botón «Actualizar» (`onRefresh`);
 * - al volver a la pantalla (como `useRefreshOnFocus`);
 * - al volver la app al frente (AppState «active»), SOLO si esta pantalla
 *   es la visible (las que quedan debajo en la pila no recargan).
 * Sin recarga periódica. Una sola petición a la vez (lo garantiza
 * `useResource`).
 */
export function useScreenRefresh(
  source: Refreshable,
  { autoPaused = false }: Options = {},
): ScreenRefresh {
  const { refreshing, refreshFailed } = source;
  const focused = useIsFocused();
  const [pulling, setPulling] = useState(false);
  /** Hubo una recarga automática mientras estaba en pausa. */
  const pending = useRef(false);
  const paused = useRef(autoPaused);
  // La función de recarga puede ser nueva en cada render (fuentes
  // combinadas): se guarda aquí para que las de abajo sean estables y el
  // foco no dispare recargas de más.
  const refreshRef = useRef(source.refresh);
  // Se actualizan después de cada render, antes de los demás efectos (va
  // primero): React no permite escribir en una referencia al dibujar.
  useEffect(() => {
    paused.current = autoPaused;
    refreshRef.current = source.refresh;
  });
  const runRefresh = useCallback(
    () => Promise.resolve(refreshRef.current()).catch(() => {}),
    [],
  );

  const autoRefresh = useCallback(() => {
    if (paused.current) {
      pending.current = true;
      return;
    }
    runRefresh().catch(() => {});
  }, [runRefresh]);

  // Al volver a esta pantalla (la primera vez no: ya está cargando).
  useRefreshOnFocus(autoRefresh);

  // Al volver la app al frente, solo si esta pantalla es la visible.
  useEffect(() => {
    if (!focused) return undefined;
    let previous: string | null = AppState.currentState ?? null;
    const subscription = AppState.addEventListener('change', (next) => {
      const wasAway = previous === 'background' || previous === 'inactive';
      previous = next;
      if (wasAway && next === 'active') autoRefresh();
    });
    return () => subscription.remove();
  }, [focused, autoRefresh]);

  // Terminó la pausa: la recarga que quedó pendiente se hace ahora.
  useEffect(() => {
    if (autoPaused || !pending.current) return;
    pending.current = false;
    runRefresh().catch(() => {});
  }, [autoPaused, runRefresh]);

  const onRefresh = useCallback(() => {
    setPulling(true);
    runRefresh().finally(() => setPulling(false));
  }, [runRefresh]);

  return {
    onRefresh,
    refreshing,
    pulling,
    failed: refreshFailed,
  };
}

/** Combina varias fuentes (pantallas con varias partes que recargar). */
export function combineRefreshables(
  sources: readonly Refreshable[],
): Refreshable {
  return {
    refresh: () =>
      Promise.all(sources.map((source) => source.refresh())).then(() => {}),
    refreshing: sources.some((source) => source.refreshing),
    refreshFailed: sources.some((source) => source.refreshFailed),
  };
}
