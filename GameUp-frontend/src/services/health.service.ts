import { apiGet } from './api';

/** Respuesta de GET /api/v1/health (definida en el backend, health.controller.ts). */
export interface HealthResponse {
  status: 'ok';
  service: 'gameup-backend';
  timestamp: string;
  database: 'conectada' | 'error';
  supabase: 'no_configurado' | 'conectado' | 'error';
}

export function getHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>('/health');
}
