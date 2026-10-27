import { useState } from 'react';
import { getHealth, type HealthResponse } from '@/services/health.service';

export type HealthCheckState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; data: HealthResponse }
  | { kind: 'error'; message: string };

/**
 * Prueba de conexión con el backend (GET /health). Es la misma lógica que
 * tenía la antigua `HomeScreen`, separada de la pantalla.
 */
export function useHealthCheck() {
  const [state, setState] = useState<HealthCheckState>({ kind: 'idle' });

  async function run() {
    setState({ kind: 'loading' });
    try {
      const data = await getHealth();
      setState({ kind: 'ok', data });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      setState({ kind: 'error', message });
    }
  }

  return { state, run };
}
