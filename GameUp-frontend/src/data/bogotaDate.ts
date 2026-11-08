/**
 * Fechas en hora de Bogotá (UTC−5, sin horario de verano). El backend
 * compara la fecha sugerida con «hoy» en Bogotá, no con la fecha del
 * teléfono: a las 11:30 p. m. de Bogotá, en UTC ya es el día siguiente.
 */
const BOGOTA_OFFSET_MS = -5 * 60 * 60 * 1000;

/** Hoy en Bogotá como AAAA-MM-DD. */
export function bogotaToday(now: number = Date.now()): string {
  return new Date(now + BOGOTA_OFFSET_MS).toISOString().slice(0, 10);
}

/** Suma días a una fecha AAAA-MM-DD (sin depender de la zona del teléfono). */
export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

/** «20 de noviembre» (para leer y para el lector de pantalla). */
export function spokenDate(date: string): string {
  const months = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  const [, month, day] = date.split('-').map(Number);
  const name = months[(month ?? 1) - 1] ?? '';
  return `${day} de ${name}`;
}
