import { addDays, bogotaToday } from '@/data/bogotaDate';

export interface SuggestedDateOption {
  key: 'none' | 'today' | 'week' | 'twoWeeks';
  label: string;
  /** AAAA-MM-DD en hora de Bogotá, o `undefined` sin fecha. */
  date: string | undefined;
}

/**
 * Opciones de fecha sugerida. «Hoy» es hoy en Bogotá, no en el teléfono:
 * el backend rechaza (422) una fecha anterior a hoy en Bogotá.
 */
export function suggestedDateOptions(
  now: number = Date.now(),
): SuggestedDateOption[] {
  const today = bogotaToday(now);
  return [
    { key: 'none', label: 'Sin fecha', date: undefined },
    { key: 'today', label: 'Hoy', date: today },
    { key: 'week', label: 'En 1 semana', date: addDays(today, 7) },
    { key: 'twoWeeks', label: 'En 2 semanas', date: addDays(today, 14) },
  ];
}
