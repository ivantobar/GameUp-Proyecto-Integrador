import { useSyncExternalStore } from 'react';

/**
 * Ajustes simulados que solo existen en desarrollo (no en la API real).
 *
 * `voiceConsent` simula si el acudiente autorizó grabar la voz. Arranca en
 * `true` para que la demo muestre el flujo completo de los mockups; desde
 * «Modo desarrollo» se puede apagar para revisar el flujo sin grabación.
 */
interface DevSettings {
  voiceConsent: boolean;
}

let settings: DevSettings = { voiceConsent: true };
const listeners = new Set<() => void>();

export const devSettings = {
  get(): DevSettings {
    return settings;
  },
  set(patch: Partial<DevSettings>) {
    settings = { ...settings, ...patch };
    listeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/** Lee y cambia los ajustes simulados desde una pantalla de desarrollo. */
export function useDevSettings() {
  const current = useSyncExternalStore(devSettings.subscribe, devSettings.get);
  return { settings: current, update: devSettings.set };
}
