import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Indica si la persona activó «reducir movimiento» en su teléfono.
 * Se actualiza solo si cambia el ajuste mientras la app está abierta.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduced(value);
      })
      .catch(() => {
        // Si el sistema no responde, se mantiene el movimiento normal.
      });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
