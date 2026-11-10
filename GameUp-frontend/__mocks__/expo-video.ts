import { View } from 'react-native';

/**
 * Simulación de expo-video para Jest (el módulo nativo no existe en las
 * pruebas). Jest la usa automáticamente por estar en `__mocks__/` de la raíz.
 *
 * El reproductor falso es un emisor de eventos mínimo: los hooks reales
 * `useEvent` y `useEventListener` de `expo` se suscriben con `addListener`,
 * y las pruebas simulan el fin del video o un error con `emit`.
 */
type Listener = (payload?: unknown) => void;

const listeners = new Map<string, Set<Listener>>();

const player = {
  play: jest.fn(),
  pause: jest.fn(),
  replay: jest.fn(),
  currentTime: 0,
  loop: false,
  muted: false,
  playing: false,
  status: 'readyToPlay' as 'idle' | 'loading' | 'readyToPlay' | 'error',
  addListener: jest.fn((event: string, listener: Listener) => {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(listener);
    return { remove: () => listeners.get(event)?.delete(listener) };
  }),
  /** Solo para pruebas: dispara un evento del reproductor. */
  emit(event: string, payload?: unknown) {
    listeners.get(event)?.forEach((listener) => listener(payload));
  },
};

export const useVideoPlayer = jest.fn(
  (_source: unknown, setup?: (p: typeof player) => void) => {
    setup?.(player);
    return player;
  },
);

export const VideoView = View;
