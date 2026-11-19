import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Indica si hay un lector de pantalla encendido (TalkBack en Android,
 * VoiceOver en iPhone). Se actualiza si se enciende o apaga con la app
 * abierta. Sirve, por ejemplo, para no cerrar algo solo antes de que el
 * lector termine de leerlo.
 */
export function useScreenReaderEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isScreenReaderEnabled()
      .then((value) => {
        if (mounted) setEnabled(value);
      })
      .catch(() => {
        // Si el sistema no responde, se supone que no hay lector.
      });
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setEnabled,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return enabled;
}
