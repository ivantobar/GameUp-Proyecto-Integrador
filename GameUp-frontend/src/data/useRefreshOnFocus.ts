import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Vuelve a pedir los datos cada vez que la pantalla regresa al frente (por
 * ejemplo, al volver de una práctica con una estrella nueva). La primera vez
 * no hace nada, porque la carga inicial ya está en curso.
 */
export function useRefreshOnFocus(refresh: () => void) {
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refresh();
    }, [refresh]),
  );
}
